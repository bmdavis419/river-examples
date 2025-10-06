# river examples

a collection of examples on how to use (river, TRPC for streams)[https://github.com/bmdavis419/river] in an actual project

## examples

### [basic river ex: ai-sdk stream](https://github.com/bmdavis419/river-examples/tree/main/basic-aisdk-example)

**shows off:**

- a `streamText` agent with a couple of tools
- a page which displays tool calls, steps, and text as them come in
- is not actually live, it hits an ai endpoint and I'm not putting that live without a wall in front of it

### [basic river ex: custom stream](https://github.com/bmdavis419/river-examples/tree/main/basic-example)

**shows off:**

- a custom stream "agent" which will check each letter of a word to see if it's a vowel
- a page which displays the letters and their status as they come in
- is actually live: https://river-example-basic-custom.vercel.app
