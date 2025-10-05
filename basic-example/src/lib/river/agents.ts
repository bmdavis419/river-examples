import { RIVER_SERVER } from '@davis7dotsh/river-alpha';
import { z } from 'zod';

export const basicExampleAgent = RIVER_SERVER.createCustomAgent({
	inputSchema: z.object({
		message: z.string()
	}),
	streamChunkSchema: z.object({
		letter: z.string(),
		isVowel: z.boolean()
	}),
	agent: async ({ message }, appendChunk) => {
		const letters = message.split('');
		const onlyLetters = letters.filter((letter) => /^[a-zA-Z]$/.test(letter));
		for (let i = 0; i < onlyLetters.length; i++) {
			const letter = onlyLetters[i];
			const isVowel = /^[aeiou]$/i.test(letter);
			appendChunk({ letter, isVowel });
			await new Promise((resolve) => setTimeout(resolve, 20));
		}
	}
});
