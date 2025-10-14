# basic example: custom stream

a really simple project showing off a custom stream built with [river](https://github.com/bmdavis419/river) (TRPC for agent streams)

you can see a live demo [here](https://river-example-basic-custom.vercel.app/)

## getting started

1. clone the repo
2. install dependencies `bun i`
3. run the project `bun dev`

## stuff to go look at:

- `src/lib/river/streams.ts` - the stream code
- `src/lib/river/router.ts` - the router code
- `src/lib/river/client.ts` - the river client definition code
- `src/routes/+page.svelte` - the page code
- `src/routes/api/river/+server.ts` - the river server endpoint code
