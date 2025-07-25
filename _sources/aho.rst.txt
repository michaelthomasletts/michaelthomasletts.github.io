.. _aho:

Petabyte-Scale Data Remediation Using Aho-Corasick Automatons
-------------------------------------------------------------

TL;DR: I optimized a core data remediation workflow at Capital One, reducing its runtime from 55 hours to just 7 seconds using the Aho-Corasick algorithm and Python multiprocessing.

OneRemedy is an enterprise data product at Capital One that remediates highly sensitive data across OneLake—a petabyte-scale data lake built on AWS S3.
The scale of data that OneRemedy processes is at the scale of petabytes, and that data is stored in various formats such as Parquet, CSV, and JSON.
Historically, OneRemedy relied on SQL and regular expressions to identify and remediate sensitive data—but this approach was notoriously inefficient, especially from the user's perspective.
For especially large datasets, it was not uncommon for remediation jobs to take as long as fifty-five hours or more.
Consequently, customers regularly experienced long wait times for the completion of large remediation requests, and OneRemedy developers were often unable to efficiently debug issues or develop new features.

Recognizing those issues upon joining the OneRemedy team, I began exploring alternative methods for efficient data remediation. 
Due to the scale of data and desperate need for runtime and memory performance, it became immediately clear to me that relational databases already burdened by other large queries across the production data team presented a tremendous bottleneck.
Through careful memory and runtime profiling, I also determined that regular expressions scaled exponentially relative to the size of sensitive substrings.
Due to the limitations of relational databases for complex pattern matching and the inefficiencies of regular expression automatons, I sought a more efficient solution than relational databases for identifying and remediating sensitive data patterns, which led me to the `Aho-Corasick algorithm <https://en.wikipedia.org/wiki/Aho%E2%80%93Corasick_algorithm>`_.
The Aho-Corasick algorithm is a string searching algorithm that creates a finite state machine (FSM) or "automaton" from a set of keywords, allowing for efficient multi-pattern matching.
The algorithm builds a trie from provided keywords and then constructs failure links to allow for backtracking, enabling it to search through the text in linear time relative to the length of the text and number of keywords.
To implement the Aho-Corasick algorithm, I utilized the ``pyahocorasick`` library, which provides a Python implementation of the algorithm.

On modern big data teams, large datasets are normally processed in a distributed manner using Apache Spark, and custom functions (UDFs) are used to apply idiosyncratic transformation logic.
However, due to concerns about efficiently sharing memory between Spark executors and the Aho-Corasick automaton, I opted to use the multiprocessing library in Python to parallelize the processing of large datasets.
This low-level implementation allowed for efficient memory sharing and ensured that the Aho-Corasick automaton could be used across multiple processes without the overhead of Spark's distributed architecture.
Profiling this solution showed it **reduced the runtime of OneRemedy's core feature from fifty-five hours to just seven seconds.**