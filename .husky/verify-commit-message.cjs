#!/usr/bin/env node
/**
 * @fileoverview Проверка формата сообщения коммита: `type: описание`.
 */

const fs = require("node:fs");

/** Допустимые типы коммита (без perf и style). */
const ALLOWED_TYPES = [
  "feat",
  "fix",
  "wip",
  "test",
  "ci",
  "docs",
  "refactor",
  "build",
  "chore",
  "revert",
  "release",
];

/**
 * Возвращает первую значимую строку сообщения (без пустых и комментариев `#`).
 * @param {object} props
 * @param {string} props.raw — сырое содержимое файла сообщения коммита
 * @returns {string}
 */
function getFirstSignificantLine(props) {
  const { raw } = props;
  const lines = raw.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      return trimmed;
    }
  }
  return "";
}

/**
 * Проверяет, является ли сообщение служебным (merge/revert), для которого формат не требуется.
 * @param {object} props
 * @param {string} props.firstLine — первая значимая строка
 * @returns {boolean}
 */
function isExemptMessage(props) {
  const { firstLine } = props;
  if (/^Merge (branch|pull request|remote-tracking branch)/.test(firstLine)) {
    return true;
  }
  if (/^Revert\s+"/.test(firstLine)) {
    return true;
  }
  return false;
}

/**
 * Проверяет сообщение коммита на соответствие `type: описание`.
 * @param {object} props
 * @param {string} props.firstLine — первая значимая строка сообщения
 * @returns {{ ok: true } | { ok: false, error: string }}
 */
function validateCommitSubject(props) {
  const { firstLine } = props;
  const types = ALLOWED_TYPES.join("|");
  const re = new RegExp(`^(${types}):\\s*(.+)$`);
  const match = firstLine.match(re);
  if (!match) {
    return {
      ok: false,
      error: [
        "Сообщение коммита должно быть в формате:",
        "  <тип>: <краткое описание>",
        "",
        `Допустимые типы: ${ALLOWED_TYPES.join(", ")}`,
        "",
        "Пример:",
        "  feat: добавить форму входа",
      ].join("\n"),
    };
  }
  const description = match[2].trim();
  if (!description) {
    return {
      ok: false,
      error: "После двоеточия нужно краткое описание (не пустая строка).",
    };
  }
  return { ok: true };
}

/**
 * Точка входа: читает путь к файлу сообщения из argv и завершает процесс с кодом 0 или 1.
 * @param {object} props
 * @param {string[]} props.argv — аргументы процесса
 */
function main(props) {
  const { argv } = props;
  const commitMsgFile = argv[2];
  if (!commitMsgFile) {
    console.error("verify-commit-message: не передан путь к файлу сообщения коммита.");
    process.exit(1);
  }

  let raw;
  try {
    raw = fs.readFileSync(commitMsgFile, "utf8");
  } catch (e) {
    console.error("verify-commit-message: не удалось прочитать файл сообщения.", e);
    process.exit(1);
  }

  const firstLine = getFirstSignificantLine({ raw });
  if (!firstLine) {
    console.error("Сообщение коммита пустое.");
    process.exit(1);
  }

  if (isExemptMessage({ firstLine })) {
    process.exit(0);
  }

  const result = validateCommitSubject({ firstLine });
  if (!result.ok) {
    console.error(result.error);
    process.exit(1);
  }

  process.exit(0);
}

main({ argv: process.argv });
