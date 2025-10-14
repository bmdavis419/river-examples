# basic example: ai-sdk stream

a really simple project showing off an ai-sdk agent built with [river](https://github.com/bmdavis419/river) (TRPC for agent streams)

this one isn't live, it hits an ai endpoint, i'm not putting that live without a wall in front of it

it's a very svelte-ty example, using the stores for the agent state because it's way nicer and easier to work with then doing it all in the script tag, but it should get the point across

## getting started

1. clone the repo
2. install dependencies `bun i`
3. grab an openrouter api key and add it to the `.env` file (see `.env.example`)
4. run the project `bun dev`

## stuff to go look at:

- `src/lib/river/streams.ts` - the agent code
- `src/lib/river/router.ts` - the router code
- `src/lib/river/client.ts` - the river client definition code
- `src/routes/+page.svelte` - the page code
- `src/routes/AgentStore.svelte.ts` - the store which has the client agent calling logic
- `src/routes/api/river/+server.ts` - the river server endpoint code
