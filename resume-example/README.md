# basic example: stream resuming

a really simple project showing off how you can make durable streams with [river](https://github.com/bmdavis419/river) (TRPC for agent streams)

we're using s2 for the stream resume logic, so you will need a free account to use it.

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
