---
date: '2025-07-30T00:06:26-04:00'
draft: false
title: 'Reducing data remediation runtime from 55 hours to 7 seconds with Aho-Corasick'
---

[Aho-Corasick](https://en.wikipedia.org/wiki/Aho%E2%80%93Corasick_algorithm) is a classic multi-pattern string matching algorithm — like regex, but significantly faster. Unlike regex, which ([depending on the implementation](https://github.com/BurntSushi/rebar?tab=readme-ov-file#dictionary)) may scale exponentially with input size, Aho-Corasick scales linearly. That property — linear time complexity — makes it *ridiculously fast*, and ideal for large-scale data remediation.

I first learned about Aho-Corasick back in 2018 but filed it away under “interesting but unnecessary for me right now.” Years later, I found myself responsible for remediating records across datasets at petabyte scale.

At the time, remediations were being performed using SQL queries embedded with regular expressions, running against an already-overloaded relational database. The approach was inefficient: *most* client datasets took between 30 minutes to an hour to process, and in some cases stretched as long as *55 hours*. As you can probably imagine, those datasets with excessive runtimes were enormous.

Recognizing an opportunity to improve things, I began re-architecting the remediation code. Given the scale of the data and the need for runtime and memory efficiency, it quickly became clear that the shared RDBMS was a major bottleneck. Profiling revealed that regular expressions — not just SQL overhead and database performance — were the primary cause of long runtimes. As the number and length of substrings grew, performance degraded exponentially. This also proved true when using Python’s built-in `re` module.

In modern data engineering, large datasets are often processed using distributed systems like Apache Spark, with custom user-defined functions to apply transformation logic. Another common tool is DuckDB, which also supports UDFs and is popular for fast local analytics and ease of use.

However, DuckDB began leaking memory at scale — confirming concerns [previously raised by the community](https://github.com/duckdb/duckdb-node/issues/55). And while Spark offered better scale, efficiently sharing a large Aho-Corasick automaton between executors introduced more complexity than it solved. User-defined functions also tend to be inefficient.

To avoid shared-memory challenges in Spark and instability in DuckDB, I opted to use Python’s built-in `multiprocessing` library in tandem with Aho-Corasick.

Since Python multiprocessing typically involves deep memory copying between processes, which would have blown up RAM usage at scale, I used the `fork` start method on Linux to ensure memory sharing via copy-on-write semantics. This allowed large, immutable data structures (like the target dataset and automatons) to be reused across processes without duplication, keeping memory usage comfy.

Additionally, I took care to scope all shared data within a global cache, which avoids passing large payloads via `Pool.apply_async(...)` calls and minimizes serialization overhead.

The results were staggering: **55 hours → 7 seconds**.

A key reason for this performance wasn’t simply the use of Aho-Corasick but *how the data was shared*. By loading large datasets and compiled automatons once, and forking worker processes afterward, I avoided memory duplication entirely. If I had passed these structures via arguments or used `spawn`, it would have resulted in prohibitive memory usage and slower compute due to unnecessary serialization and GC pressure.

## Important Concepts

Before you rush to implement Aho-Corasick expecting miracles, a word of caution: **Aho-Corasick + parallelization won’t yield superb performance unless your code is optimized.**

To borrow from the pseudo-code further below, you’ll need to understand:

- The difference between “spawn” and “fork” memory allocation modes in Python’s multiprocessing module and how fork enables memory-efficient parallelism via copy-on-write. This matters because using spawn (the default on macOS and Windows) will fully copy large objects, causing massive memory spikes if you’re not careful. On Linux, fork allows those objects to be shared so long as they’re never mutated.
- The importance of the [“tidy data” principle](https://r4ds.had.co.nz/tidy-data.html) and general data layout — so your data can be scanned efficiently.
- The necessity of **profiling** your code, early and often.[^1]

Additionally, realize you may not need to use the `multiprocessing` library after all. You might be able to write a user-defined function that’s implemented in DuckDB or Spark. That decision depends primarily on the scale of your data[^2] and-or comfort with digging deep into Spark. To be honest, I actually *recommend* that you use a user-defined function in DuckDB — that is, if the scale of your data isn’t enormous. It will be less efficient than using Aho-Corasick + `multiprocessing` but certainly simpler.

## How to Use Aho-Corasick with Python

The pseudo-code that follows accepts two pandas `DataFrame` objects: `target` and `sensitive_values`.

- `target` contains the data that must be scanned for sensitive content and remediated
sensitive_values contains the values to search for and obfuscate
- The Aho-Corasick automaton does not care how sensitive values appear in target—whether as substrings or exact matches. All matches are remediated the same way.

For example:

- If `"1234"` is a sensitive value, then `"1234_5678"` becomes `"xXxX_5678"`
- If `"1234"` appears on its own, it becomes `"xXxX"`. 

Multiple matches per record are handled without issue. Referring back to the tidy data concept: `sensitive_values` is represented in a long format.

To illustrate:

```python
[
  {"element_name": "x", "sensitive_value": "1234"},
  {"element_name": "x", "sensitive_value": "5678"},
  {"element_name": "y", "sensitive_value": "abc"}
]
```

Why does this matter? Because this long format allows the data to be grouped by `element_name`, deduplicated, and quickly loaded into per-column automatons. Each parallel process then scans each record in each column for matches in its associated automaton.

Lastly, you’ll need to download [`pyahocorasick`](pyahocorasick) and `pandas`. You can use `polars` instead of `pandas` if you prefer. `polars` may actually make the following pseudo-code even faster, albeit marginally. There are also Rust-based implementations available out there online.

```python
import gc
from collections import defaultdict
from multiprocessing import Pool, get_context

import pandas as pd
from ahocorasick import Automaton


# Singleton cache used to hold large, immutable shared data 
# (e.g. automatons, target df).
# Under 'fork' mode, this data is shared across processes 
# via copy-on-write, avoiding memory duplication.
class ObfuscatorCache:
    def __init__(self):
        self.automatons = None
        self.target = None
        self.executor = None
        self.metrics = 0


# initializing global cache object for sharing immutable
# data between processes
cache = ObfuscatorCache()


class Obfuscator:
    def __init__(
        self,
        sensitive_values: pd.DataFrame,
        target: pd.DataFrame,
        automatons: dict[str, Automaton] | None = None,
        max_workers: int | None = None,
    ):
        self._sensitive_values = sensitive_values
        self._max_workers = 5 if max_workers is None else max_workers
        
        # Enables copy-on-write memory sharing on Linux/Unix
        self._ctx = get_context("fork")
        cache.target = target
        cache.automatons = (
            self.make_automatons(sensitive_values)
            if automatons is None
            else automatons
        )

    @property
    def target(self) -> pd.DataFrame:
        return cache.target

    @target.setter
    def target(self, value: pd.DataFrame):
        cache.target = value
        if hasattr(self, "_ctx"):
            self._ctx.target = value

    @property
    def metrics(self) -> int:
        return cache.metrics

    @metrics.setter
    def metrics(self, value: int):
        cache.metrics = value

    @property
    def automatons(self) -> dict[str, Automaton]:
        return cache.automatons

    @property
    def executor(self) -> Pool:
        if cache.executor is None:
            cache.executor = self._ctx.Pool(processes=self._max_workers)
        return cache.executor

    def shutdown_executor(self):
        if cache.executor is not None:
            cache.executor.terminate()
            cache.executor.join()
            cache.executor = None

    @staticmethod
    def make_automaton(patterns: set) -> Automaton:
        A = Automaton()
        for pattern in patterns:
            A.add_word(pattern, pattern)
        A.make_automaton()
        return A
    
    def make_automatons(self, sensitive_values: pd.DataFrame) -> dict[str, Automaton]:
        findings = defaultdict(set)
        for element, group in sensitive_values.groupby("element_name"):
            findings[element].update(str(finding) for finding in group["sensitive_value"])
        del self._sensitive_values
        return {
            element: self.make_automaton(patterns)
            for element, patterns in findings.items()
        }
    
    def obfuscate(self, inplace: bool = True) -> pd.DataFrame:
        if not inplace:
            obfuscated_target = self.target.copy()
            futures = [
                self.executor.apply_async(self._obfuscate_column, args=(column,))
                for column in self.automatons.keys()
            ]
            for future in futures:
                column, obfuscated_series, local_counts = future.get()
                obfuscated_target[column] = obfuscated_series
                self.metrics += local_counts[column]
            return obfuscated_target
        
         else:
            futures = [
                self.executor.apply_async(self._obfuscate_column, args=(column,))
                for column in self.automatons.keys()
            ]
            for future in futures:
                column, obfuscated_series, local_counts = future.get()
                self.target[column] = obfuscated_series
                self.metrics += local_counts[column]
                del column, obfuscated_series, local_counts, future
                gc.collect()
            return self.target
    
    def _obfuscate_column(self, column: str) -> tuple[str, pd.Series, dict[str, int]]:
        local_metrics = defaultdict(int)
        series = self.target[column]
        obfuscated_series = series.map(
            lambda v: self._obfuscate_record(v, self.automatons, column, local_metrics)
        )
        return column, obfuscated_series, local_metrics
    
    @staticmethod
    def _obfuscate_record(
        value: str,
        automatons: dict[str, Automaton],
        column: str,
        counter: dict,
        obfuscate_char: str = "x",
    ) -> str:
        if not (
            matches := [
                (end - len(match) + 1, end)
                for end, match in automatons[column].iter(value)
            ]
        ):
            return value
        
        merged = []
        for start, end in sorted(matches):
            if not merged or start > merged[-1][1]:
                merged.append([start, end])
            else:
                merged[-1] = (merged[-1][0], max(merged[-1][1], end))
        
        chars = list(value)
        counter[column] += len(merged)
        
        for start, end in merged:
            length = end - start + 1
            pattern = (obfuscate_char + obfuscate_char.upper()) * ((length + 1) // 2)
            chars[start : end + 1] = list(pattern[:length])
        return "".join(chars)
```

[^1]: If you want a tool that makes memory and runtime profiling incredibly easy then check out [this repository I wrote](https://github.com/michaelthomasletts/profile-this). Sometimes, line-by-line profiling is too granular; rather, you need to understand how your code performs, from a memory allocation perspective, *temporally*. I wrote this repository for those situations exactly — but with an emphasis on simplicity and speed.

[^2]: I am not aware of any hard and fast statistics on exact thresholds for memory leakage in DuckDB so DYOR and experimentation.