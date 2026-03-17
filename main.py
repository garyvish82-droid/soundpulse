"""
SoundPulse MCP Server — Entry Point
=======================================
Starts the FastMCP server with all 8 UX analysis tools exposed
over streamable HTTP (for remote use) or stdio (for local Claude Desktop).

Usage:
  Local (stdio):   python main.py --transport stdio
  Remote (HTTP):   python main.py --transport http
  Docker/Lambda:   automatically uses HTTP via ENV var

Environment variables: see .env.example
"""
import argparse
import logging
import os

from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-7s  %(name)s — %(message)s",
)
logger = logging.getLogger("soundpulse")


def main():
    parser = argparse.ArgumentParser(description="SoundCloud UX MCP Server")
    parser.add_argument(
        "--transport",
        choices=["stdio", "http"],
        default=os.getenv("MCP_TRANSPORT", "http"),
        help="Transport mode: stdio (local) or http (remote). Default: http",
    )
    parser.add_argument(
        "--host",
        default=os.getenv("MCP_SERVER_HOST", "0.0.0.0"),
        help="Host to bind (HTTP mode only)",
    )
    parser.add_argument(
        "--port",
        type=int,
        default=int(os.getenv("MCP_SERVER_PORT", "8080")),
        help="Port to bind (HTTP mode only)",
    )
    args = parser.parse_args()

    # Import tools — this registers all @mcp.tool decorators
    from src.tools.mcp_tools import mcp  # noqa: F401

    logger.info("━" * 60)
    logger.info("  SoundPulse · UX Intelligence MCP Server")
    logger.info("━" * 60)
    logger.info(f"  Transport : {args.transport.upper()}")
    if args.transport == "http":
        logger.info(f"  Address   : http://{args.host}:{args.port}")
    logger.info("  Tools     : 8 registered")
    logger.info("━" * 60)

    if args.transport == "http":
        mcp.run(transport="streamable-http", host=args.host, port=args.port)
    else:
        mcp.run(transport="stdio")


if __name__ == "__main__":
    main()
