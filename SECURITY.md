# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| latest  | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability in this project, please report it responsibly:

1. **Do NOT** open a public GitHub issue for security vulnerabilities
2. Email the maintainer directly (see README for contact info)
3. Include a description of the vulnerability and steps to reproduce
4. Allow reasonable time for a fix before public disclosure

## Security Measures

- No hardcoded credentials or API keys
- No external network calls (all communication is local CDP)
- No user data collection
- localStorage only stores panel position (non-sensitive)
- Regular security scans with gitleaks and semgrep

## Scope

This project interacts with Trae IDE via Chrome DevTools Protocol (CDP) on localhost only. It does not:

- Make external network requests
- Collect or transmit user data
- Access files outside the Trae workspace
- Modify Trae's core functionality

The injected JavaScript only scans for and clicks specific UI buttons within the Trae interface.
