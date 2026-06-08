# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

ComplexityLab is a Java project. No build system (Maven/Gradle) has been configured yet.

## MCP Server

A [Firecrawl](https://github.com/mendableai/firecrawl-mcp-server) MCP server is configured in `.vscode/mcp.json`. It requires a `FIRECRAWL_API_KEY` (prompted at runtime via VS Code input). This enables web scraping and crawling from within the editor.
