import { RIVER_PROVIDERS, RIVER_STREAMS, RiverError } from '@davis7dotsh/river-alpha';
import { z } from 'zod';

export const basicExampleAgent = RIVER_STREAMS.createRiverStream()
	.input(
		z.object({
			message: z.string()
		})
	)
	.runner(async (stuff) => {
		const { initStream, input } = stuff;

		const stream = await initStream(
			RIVER_PROVIDERS.defaultRiverStorageProvider<{
				letter: string;
				isVowel: boolean;
			}>()
		);

		const { message } = input;

		stream.sendData(async ({ appendChunk, close }) => {
			const letters = message.split('');
			const onlyLetters = letters.filter((letter) => /^[a-zA-Z]$/.test(letter));
			for (let i = 0; i < onlyLetters.length; i++) {
				const letter = onlyLetters[i];
				if (letter === 'z') {
					throw new RiverError('z is illegal here');
				}
				const isVowel = /^[aeiou]$/i.test(letter);
				appendChunk({ letter, isVowel });
				await new Promise((resolve) => setTimeout(resolve, 60));
			}

			close();
		});

		return stream;
	});
