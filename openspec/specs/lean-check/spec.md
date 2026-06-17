# lean-check Specification

## Purpose
Define Lean 4 checking for architecture-sensitive OpenSpec meaning so formal models compile during validation and CI without replacing prose specs, tests, reviews, or implementation.

## Requirements
### Requirement: Lean support SHALL run by default
OpenSpec validation SHALL run Lean 4 checks by default so architectural intent cannot silently drift outside the normal validation path.

#### Scenario: Validation without Lean project
- **WHEN** a user runs `openspec validate --all` in a project without a configured Lean root
- **THEN** OpenSpec SHALL validate changes and specs normally
- **AND** it SHALL include a failed Lean validation item explaining that the Lean root is missing

#### Scenario: Explicit structural-only validation
- **WHEN** a user runs `openspec validate --all --no-lean`
- **THEN** OpenSpec SHALL skip the Lean check for that command
- **AND** it SHALL validate only the requested OpenSpec structures

### Requirement: Project config SHALL declare Lean check settings
Project config SHALL allow a `lean` section that declares whether Lean checks are enabled, where the Lean project lives, which command to run, command arguments, and timeout.

#### Scenario: Configured Lean project
- **GIVEN** `openspec/config.yaml` contains `lean.enabled: true`
- **AND** `lean.root` points at a directory containing a Lean project
- **WHEN** OpenSpec validation runs
- **THEN** OpenSpec SHALL run the configured Lean command from that root

#### Scenario: Lean disabled by project config
- **GIVEN** `openspec/config.yaml` contains `lean.enabled: false`
- **WHEN** OpenSpec validation runs without `--lean`
- **THEN** OpenSpec SHALL skip Lean checks

#### Scenario: Lean forced by flag
- **GIVEN** `openspec/config.yaml` contains `lean.enabled: false`
- **WHEN** a user runs `openspec validate --lean`
- **THEN** OpenSpec SHALL run the configured Lean command anyway

### Requirement: Lean check results SHALL use validation issue shape
Lean check output SHALL be converted into the same validation issue shape used by OpenSpec validation.

#### Scenario: Lean build fails
- **WHEN** the Lean command exits non-zero
- **THEN** OpenSpec SHALL mark the Lean validation item invalid
- **AND** it SHALL include a validation issue with level `ERROR`, path identifying the Lean root, and message containing Lean output

#### Scenario: Lean tool missing
- **WHEN** Lean checking is requested but the configured command cannot be executed
- **THEN** OpenSpec SHALL mark the Lean validation item invalid
- **AND** it SHALL include a validation issue explaining that the Lean command could not run

### Requirement: Lean model SHALL preserve architecture-sensitive intent
Lean models SHALL be treated as compact formal source of truth for modeled concepts, relations, invariants, and laws that must not silently drift.

#### Scenario: Point-like and interval-like media stay distinct
- **GIVEN** a Lean model distinguishes point-like media from interval-like media
- **AND** the model defines temporal overlap only for interval-to-interval relations
- **AND** the model defines point-within-interval separately for point-to-interval relations
- **WHEN** an implementation change would coerce a point into an interval to satisfy local behavior
- **THEN** the agent SHALL update the Lean model if semantics intentionally changed
- **AND** otherwise the Lean check SHALL fail when the implementation shortcut conflicts with modeled laws

### Requirement: CI SHALL be able to run Lean validation
OpenSpec SHALL document a CI-compatible command for running structural validation and Lean checks together.

#### Scenario: CI command
- **WHEN** project maintainers want architectural model checks in CI
- **THEN** OpenSpec documentation SHALL recommend `openspec validate --all --json`
- **AND** projects SHALL be able to use that command with a configured Lean project root
