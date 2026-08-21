# Ashes Brain — Claude Connectors Directory submission brief

## Connection
- Server URL: https://www.ashesstack.cloud/mcp
- Transport: Streamable HTTP / JSON-RPC over HTTPS
- Same URL for every user: Yes
- Authentication: OAuth 2.0 authorization code + PKCE
- OAuth client setup: Dynamic client registration supported

## Listing
- Server name: Ashes Brain
- Tagline: One shared project memory for every AI.
- Suggested categories: Productivity, Code
- Suggested slug: ashes-brain
- Documentation: https://www.ashesstack.cloud/brain/docs
- Privacy policy: https://www.ashesstack.cloud/privacy
- Terms: https://www.ashesstack.cloud/terms
- Website: https://www.ashesstack.cloud/workspace
- Support: hello@ashes.studio
- Icon: https://www.ashesstack.cloud/ashes-logo-transparent.webp

### Detail description
Ashes Brain keeps project context consistent across AI clients. Connect Claude to Ashes once, then Claude can retrieve the same project goals, decisions, memories, conversations and handoffs used by other supported AI tools. Users can ask Claude to continue an existing Ashes project, search prior decisions, save durable context, or leave a handoff for the next AI working on the project. Ashes Brain accounts and OAuth sessions are separate from the Ashes Stack client, team and admin portal.

## Primary use cases
1. Continue a project in Claude without re-explaining context already stored in Ashes Brain.
2. Search decisions and project memory created in other AI clients.
3. Save an important decision or durable piece of context back to the shared Brain.
4. Leave a concise handoff so another supported AI client can continue from the same state.
5. List all Ashes projects and choose which project Claude should work from.

## Prerequisites
- User needs a free Ashes Brain account at https://www.ashesstack.cloud/workspace/login.
- User authorizes the connector through the Ashes OAuth screen.
- No provider API key, ChatGPT/Claude password, browser cookie or provider session token is required by Ashes.

## Capabilities
- Reads data: Yes
- Writes data: Yes
- Destructive tools: No
- Public/external actions: No
- Underlying API: First-party Ashes Brain service
- Personal health data: Not an intended use case
- Sponsored content: No

## Exposed tools
- list_projects — read-only
- get_project_context — read-only
- search — read-only
- fetch — read-only
- remember — writes private Brain memory
- handoff — writes a private Brain handoff

All tools include a title plus explicit read/write, destructive and open-world annotations in the MCP descriptor.

## Reviewer testing
Create a populated reviewer Brain account before submitting and provide its credentials only through Anthropic's private submission portal.

Recommended seeded project:
- Project: Connector Review Demo
- Goal: Keep project context synchronized across Claude and other supported AI clients.
- Memory examples:
  - Decision: Use a separate Brain account from the Ashes Stack client portal.
  - Memory: MCP endpoint is https://www.ashesstack.cloud/mcp.
  - Handoff: OAuth, tool discovery and MongoDB persistence have passed end-to-end testing.

Test prompts:
1. “List my Ashes projects.”
2. “Continue Connector Review Demo and summarize what we already decided.”
3. “Search my Ashes memory for authentication.”
4. “Remember that the public beta should launch after directory approval.”
5. “Save a handoff saying the connector review test completed successfully.”

## Submission checklist
- [x] HTTPS remote MCP endpoint
- [x] OAuth 2.0 authentication
- [x] PKCE
- [x] Dynamic client registration
- [x] Tool titles
- [x] Tool read/write annotations
- [x] Public documentation URL
- [x] Public privacy policy URL
- [x] Public terms URL
- [x] Support contact
- [x] Icon URL
- [x] All tools exercised in Ashes end-to-end self-test
- [ ] Create a dedicated reviewer test account and seed demo data
- [ ] Submit from a Claude Team/Enterprise organization with Directory management access
