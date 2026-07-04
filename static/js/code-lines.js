(function () {
  const lineIdPattern = /^hl-(\d+)-(\d+)$/;
  let activeStart = null;
  let activeRange = null;
  let actionWidget = null;

  function parseLineId(id) {
    const match = lineIdPattern.exec(id || "");
    if (!match) {
      return null;
    }

    return {
      block: Number(match[1]),
      line: Number(match[2]),
    };
  }

  function lineId(block, line) {
    return `hl-${block}-${line}`;
  }

  function parseHash(hash) {
    const value = hash.replace(/^#/, "");
    const rangeMatch = /^(hl-\d+-\d+)-L(\d+)$/.exec(value);

    if (rangeMatch) {
      const start = parseLineId(rangeMatch[1]);
      if (!start) {
        return null;
      }

      return {
        block: start.block,
        start: start.line,
        end: Number(rangeMatch[2]),
      };
    }

    const singleLine = parseLineId(value);
    if (!singleLine) {
      return null;
    }

    return {
      block: singleLine.block,
      start: singleLine.line,
      end: singleLine.line,
    };
  }

  function normalizedRange(range) {
    const start = Math.min(range.start, range.end);
    const end = Math.max(range.start, range.end);

    return {
      block: range.block,
      start,
      end,
    };
  }

  function codeLinesFor(lineNumberElement) {
    const row = lineNumberElement.closest("tr");
    if (!row) {
      return [];
    }

    return Array.from(
      row.querySelectorAll("td:last-child pre code > span")
    );
  }

  function clearSelectedLines() {
    document
      .querySelectorAll(".code-line-selected")
      .forEach((element) => element.classList.remove("code-line-selected"));
  }

  function hideActionMenu() {
    if (actionWidget) {
      actionWidget.hidden = true;
      actionWidget.classList.remove("code-line-menu-open");
    }
  }

  function clearSelection() {
    clearSelectedLines();
    activeStart = null;
    activeRange = null;
    hideActionMenu();

    if (parseHash(window.location.hash)) {
      history.pushState(null, "", `${window.location.pathname}${window.location.search}`);
    }
  }

  function scrollToLine(lineNumberElement) {
    lineNumberElement.scrollIntoView({
      block: "center",
      inline: "nearest",
    });
  }

  function scrollToRange(range) {
    const normalized = normalizedRange(range);
    const firstLine = document.getElementById(lineId(normalized.block, normalized.start));
    if (!firstLine) {
      return;
    }

    scrollToLine(firstLine);
  }

  function scheduleScrollToRange(range) {
    requestAnimationFrame(() => scrollToRange(range));
    setTimeout(() => scrollToRange(range), 100);
    setTimeout(() => scrollToRange(range), 350);
  }

  function selectedCodeText(range) {
    const normalized = normalizedRange(range);
    const firstLine = document.getElementById(lineId(normalized.block, normalized.start));
    if (!firstLine) {
      return "";
    }

    return codeLinesFor(firstLine)
      .slice(normalized.start - 1, normalized.end)
      .map((line) => line.textContent.replace(/\n$/, ""))
      .join("\n");
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }

    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.top = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();

    return Promise.resolve();
  }

  function selectedPermalink(range) {
    const hash = hashForRange(range);
    return `${window.location.origin}${window.location.pathname}${window.location.search}#${hash}`;
  }

  function setCopiedLabel(button) {
    const label = button.textContent;
    button.textContent = "Copied!";
    window.setTimeout(() => {
      if (button.textContent === "Copied!") {
        button.textContent = label;
      }
    }, 1600);
  }

  function ensureActionMenu() {
    if (actionWidget) {
      return actionWidget;
    }

    actionWidget = document.createElement("div");
    actionWidget.className = "code-line-menu";
    actionWidget.hidden = true;
    actionWidget.innerHTML = [
      '<button class="code-line-menu-trigger" type="button" aria-label="Code line actions" aria-expanded="false">...</button>',
      '<div class="code-line-menu-panel" hidden>',
      '<button type="button" data-code-line-action="copy-code">Copy line</button>',
      '<button type="button" data-code-line-action="copy-link">Copy permalink</button>',
      '</div>',
    ].join("");

    actionWidget.addEventListener("click", (event) => {
      const trigger = event.target.closest(".code-line-menu-trigger");
      if (trigger) {
        const isOpen = actionWidget.classList.toggle("code-line-menu-open");
        actionWidget.querySelector(".code-line-menu-panel").hidden = !isOpen;
        trigger.setAttribute("aria-expanded", String(isOpen));
        event.stopPropagation();
        return;
      }

      const button = event.target.closest("button[data-code-line-action]");
      if (!button || !activeRange) {
        return;
      }

      event.stopPropagation();

      if (button.dataset.codeLineAction === "copy-code") {
        copyText(selectedCodeText(activeRange)).then(() => setCopiedLabel(button));
      }

      if (button.dataset.codeLineAction === "copy-link") {
        copyText(selectedPermalink(activeRange)).then(() => setCopiedLabel(button));
      }
    });

    document.body.appendChild(actionWidget);
    return actionWidget;
  }

  function positionActionMenu() {
    if (!actionWidget || actionWidget.hidden || !activeRange) {
      return;
    }

    const normalized = normalizedRange(activeRange);
    const firstLine = document.getElementById(lineId(normalized.block, normalized.start));
    if (!firstLine) {
      hideActionMenu();
      return;
    }

    const lineNumberRect = firstLine.getBoundingClientRect();
    const lineNumberCell = firstLine.closest("td");
    const lineNumberCellRect = lineNumberCell.getBoundingClientRect();
    const left = lineNumberCellRect.left - actionWidget.offsetWidth - 8;
    actionWidget.style.left = `${Math.max(0, left)}px`;
    actionWidget.style.top = `${lineNumberRect.top}px`;
  }

  function showActionMenu(range) {
    const normalized = normalizedRange(range);
    const firstLine = document.getElementById(lineId(normalized.block, normalized.start));
    if (!firstLine) {
      hideActionMenu();
      return;
    }

    const menu = ensureActionMenu();
    const lineCount = normalized.end - normalized.start + 1;
    const copyCodeButton = menu.querySelector('[data-code-line-action="copy-code"]');
    copyCodeButton.textContent = lineCount === 1 ? "Copy line" : "Copy lines";
    menu.classList.remove("code-line-menu-open");
    menu.querySelector(".code-line-menu-panel").hidden = true;
    menu.querySelector(".code-line-menu-trigger").setAttribute("aria-expanded", "false");

    menu.hidden = false;
    positionActionMenu();
    requestAnimationFrame(positionActionMenu);
  }

  function selectRange(range, options) {
    const normalized = normalizedRange(range);
    const firstLine = document.getElementById(lineId(normalized.block, normalized.start));
    if (!firstLine) {
      return;
    }

    const lineNumbers = Array.from(
      firstLine.closest("code").querySelectorAll("span[id]")
    );
    const codeLines = codeLinesFor(firstLine);

    clearSelectedLines();
    activeRange = normalized;

    for (let line = normalized.start; line <= normalized.end; line += 1) {
      const lineNumber = lineNumbers[line - 1];
      const codeLine = codeLines[line - 1];

      if (lineNumber) {
        lineNumber.classList.add("code-line-selected");
      }

      if (codeLine) {
        codeLine.classList.add("code-line-selected");
      }
    }

    showActionMenu(normalized);

    if (options && options.scroll) {
      scrollToLine(firstLine);
    }

    if (options && options.scheduleScroll) {
      scheduleScrollToRange(normalized);
    }
  }

  function hashForRange(range) {
    const normalized = normalizedRange(range);

    if (normalized.start === normalized.end) {
      return lineId(normalized.block, normalized.start);
    }

    return `${lineId(normalized.block, normalized.start)}-L${normalized.end}`;
  }

  function setHash(range) {
    const hash = hashForRange(range);
    history.pushState(null, "", `#${hash}`);
    selectRange(range, { scroll: true });
  }

  function bindLineLinks() {
    document.querySelectorAll(".highlight table td:first-child span[id] a").forEach((link) => {
      link.addEventListener("click", (event) => {
        const current = parseLineId(link.parentElement.id);
        if (!current) {
          return;
        }

        event.preventDefault();

        if (event.shiftKey && activeStart && activeStart.block === current.block) {
          setHash({
            block: current.block,
            start: activeStart.line,
            end: current.line,
          });
          return;
        }

        activeStart = current;
        setHash({
          block: current.block,
          start: current.line,
          end: current.line,
        });
      });
    });
  }

  function bindClearSelection() {
    document.addEventListener("click", (event) => {
      if (event.target.closest(".highlight table td:first-child span[id] a")) {
        return;
      }

      if (event.target.closest(".code-line-menu")) {
        return;
      }

      clearSelection();
    });
  }

  function bindMenuRepositioning() {
    window.addEventListener("scroll", positionActionMenu, { passive: true });
    window.addEventListener("resize", positionActionMenu);
  }

  function selectFromHash(options) {
    const range = parseHash(window.location.hash);
    if (!range) {
      clearSelectedLines();
      activeRange = null;
      hideActionMenu();
      return;
    }

    activeStart = {
      block: range.block,
      line: range.start,
    };
    selectRange(range, options || { scroll: true });
  }

  document.addEventListener("DOMContentLoaded", () => {
    bindLineLinks();
    bindClearSelection();
    bindMenuRepositioning();
    selectFromHash({ scheduleScroll: true });
  });
  window.addEventListener("load", () => selectFromHash({ scheduleScroll: true }));
  window.addEventListener("hashchange", () => selectFromHash({ scroll: true }));
})();
