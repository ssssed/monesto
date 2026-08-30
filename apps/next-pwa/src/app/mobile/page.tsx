import Image from 'next/image';

export default function MobileHome() {
	return (
		<div className='flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black'>
			<main className='flex flex-1 w-full flex-col items-center justify-between py-16 px-6 bg-white dark:bg-black'>
				<Image
					className='dark:invert h-5 w-[100px]'
					src='/next.svg'
					alt='Next.js logo'
					width={100}
					height={20}
					priority
				/>
				<div className='flex flex-col items-center gap-6 text-center'>
					<h1 className='text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50'>
						Mobile version
					</h1>
					<p className='text-lg leading-8 text-zinc-600 dark:text-zinc-400'>
						This page is served from{' '}
						<code className='rounded bg-black/[.06] px-1.5 py-0.5 font-mono text-[0.9em] dark:bg-white/[.08]'>
							app/mobile
						</code>{' '}
						based on the request User-Agent.
					</p>
				</div>
			</main>
		</div>
	);
}
