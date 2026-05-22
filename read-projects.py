from pathlib import Path

# Folders/files you usually don't want in the structure
IGNORE = {
    # Dependencies
    "node_modules",
    "vendor",

    # Git / IDE / Editor
    ".git",
    ".github",
    ".idea",
    ".vscode",

    # Environment / secrets
    ".env",
    ".env.*",
    "*.env",
    "env",
    ".venv",
    "venv",

    # Logs
    "logs",
    "log",
    "*.log",
    "npm-debug.log*",
    "yarn-debug.log*",
    "yarn-error.log*",
    "pnpm-debug.log*",
    ".tanstack",

    # OS files
    ".DS_Store",
    "Thumbs.db",

    # General build outputs
    "dist",
    "build",
    "out",
    "coverage",
    ".cache",
    "tmp",
    "temp",

    # Node.js / TypeScript
    ".next",
    ".nuxt",
    ".angular",
    ".svelte-kit",
    ".vite",
    ".turbo",
    ".parcel-cache",
    ".eslintcache",
    "npm-debug.log",
    "yarn.lock",
    "package-lock.json",
    "pnpm-lock.yaml",

    # Java / Spring Boot
    "target",
    ".gradle",
    "gradle",
    "build",
    "*.class",
    "*.jar",
    "*.war",
    "*.ear",
    "hs_err_pid*",
    "replay_pid*",

    # Test / cache
    "__pycache__",
    ".pytest_cache",
    ".mypy_cache",
    ".ruff_cache",

    # Generated output
    "structure.txt",

    # Netlify
    ".netlify",
}

OUTPUT_FILE = "structure.txt"


def should_ignore(path: Path) -> bool:
    return path.name in IGNORE or path.name == OUTPUT_FILE


def build_structure(root: Path, prefix: str = "") -> list[str]:
    lines = []

    items = sorted(
        [item for item in root.iterdir() if not should_ignore(item)],
        key=lambda item: (not item.is_dir(), item.name.lower())
    )

    for index, item in enumerate(items):
        is_last = index == len(items) - 1
        connector = "└── " if is_last else "├── "
        lines.append(f"{prefix}{connector}{item.name}")

        if item.is_dir():
            extension = "    " if is_last else "│   "
            lines.extend(build_structure(item, prefix + extension))

    return lines


def main():
    project_root = Path.cwd()
    output_path = project_root / OUTPUT_FILE

    lines = [project_root.name]
    lines.extend(build_structure(project_root))

    output_path.write_text("\n".join(lines), encoding="utf-8")

    print(f"Project structure created: {output_path}")


if __name__ == "__main__":
    main()