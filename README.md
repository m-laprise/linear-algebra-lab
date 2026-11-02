# Linear Algebra Lab

**Closed experiment — AI-agent demonstration only.** This repository records an experiment in using AI coding agents to build an interactive dashboard. It is retained to demonstrate the agents’ capabilities and the role of human direction and review. It is not a released teaching resource, is not part of the academic website, and is no longer under active development.

The dashboard explores small matrices, transformations, coordinates, and bases, with an optional regression example. Its source, tests, and development conversations remain available for inspection. The code was generated with GPT-6-Astra through OpenAI Codex CLI, with human interventions during design and development. The [prompts and responses](docs/Oct16session_agentlog.txt) document that process. The dashboard itself retains its original project caption.

## Local preview

Run these commands from this repository. Docker with Docker Compose must be running; no host Node, npm, Python, or Hugo installation is needed.

```sh
sh scripts/dev.sh
```

Open **http://localhost:5173/linear-algebra/**. This is a standalone local dashboard; it does not use or modify the academic website. The first run builds the development image and installs the locked dependencies, so it can take several minutes. Later runs reuse Docker's build cache.

To stop the preview and remove its containers, network, and dependency volume:

```sh
docker compose down --volumes --remove-orphans
```

The same startup command recreates everything needed on the next run. To also remove the cached application image:

```sh
docker image rm linear-algebra-lab-lab
```

The service uses your UID/GID, drops Linux capabilities, prevents privilege escalation, and publishes its port only on localhost. Source files are mounted into `/workspace`; dependencies live in a Docker volume. Neither SSH keys nor the Docker socket is mounted into the application container.

## Tests and build

With the local preview running:

```sh
docker compose exec lab npm test
docker compose exec lab npm run test:e2e
docker compose exec lab npm run build
```

The container includes SymPy and Chromium, Firefox, and WebKit. To regenerate the independent mathematical fixtures:

```sh
docker compose exec lab python3 scripts/generate-fixtures.py
```

The build writes `dist/`; browser tests write `test-results/`. These are generated, ignored files and can be deleted after use. Automated checks are part of the experiment's record; they do not establish suitability for classroom use.

## Project record

- [Mathematical and interaction design](docs/DESIGN.md)
- [Validation and closure record](docs/VALIDATION.md)
- [Original human review checklist (not completed)](docs/REVIEW_CHECKLIST.md)
- [Session prompts and responses](docs/Oct16session_agentlog.txt)

The academic-site integration and its temporary preview were removed when the experiment was closed. No website deployment is planned.

## License

Copyright © 2026 Marie-Lou Laprise. Licensed under [GNU GPL version 3](LICENSE), GPL-3.0-only. Bundled third-party libraries retain their respective licenses; see [third-party notices](docs/THIRD_PARTY_NOTICES.md).
