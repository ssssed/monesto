<script lang="ts">
	import { CategoryScale, Chart, Filler, LinearScale, LineElement, PointElement } from 'chart.js';
	import { Line } from 'svelte-chartjs';

	import { format } from 'date-fns';
	import { ru } from 'date-fns/locale';
	import { __CHART_DATA__ } from '../model/__mocks__';

	Chart.register(LineElement, PointElement, LinearScale, CategoryScale, Filler);

	let period = $state<'1M' | '3M' | '6M' | '1Y' | 'ALL'>('6M');

	const filters = ['1M', '3M', '6M', '1Y', 'ALL'] as const;

	function getFilteredData() {
		const now = new Date(__CHART_DATA__[__CHART_DATA__.length - 1].date);

		const monthsMap = {
			'1M': 1,
			'3M': 3,
			'6M': 6,
			'1Y': 12,
			ALL: 999
		};

		const limit = monthsMap[period];

		return __CHART_DATA__.filter((item) => {
			const d = new Date(item.date);
			const diff = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());

			return diff < limit;
		});
	}

	const chartData = $derived(() => {
		const data = getFilteredData();

		return {
			labels: data.map((d) => format(new Date(d.date), 'MMM', { locale: ru })),
			datasets: [
				{
					data: data.map((d) => d.value),
					borderColor: '#3B82F6',
					borderWidth: 3,
					tension: 0.45,
					fill: true,
					pointRadius: (ctx) => (ctx.dataIndex === ctx.dataset.data.length - 1 ? 5 : 0),
					pointBackgroundColor: '#3B82F6',
					pointBorderWidth: 0,
					backgroundColor: (ctx) => {
						const { chart } = ctx;
						const { ctx: c, chartArea } = chart;
						if (!chartArea) return;

						const gradient = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
						gradient.addColorStop(0, 'rgba(59,130,246,0.25)');
						gradient.addColorStop(1, 'rgba(59,130,246,0)');
						return gradient;
					}
				}
			]
		};
	});

	const options = {
		responsive: true,
		maintainAspectRatio: false,
		plugins: {
			legend: { display: false },
			tooltip: { enabled: false }
		},
		scales: {
			x: {
				grid: { display: false },
				ticks: {
					color: '#94A3B8',
					font: { size: 14 }
				}
			},
			y: {
				display: false
			}
		}
	};
</script>

<div class="p-4 rounded-[12px] border border-solid border-[#F1F5 shadow-sm w-full mb-5">
	<div class="h-[200px]">
		<Line data={chartData()} {options} />
	</div>

	<!-- Filters -->
	<div class="flex justify-between mt-4 text-sm">
		{#each filters as f}
			<button
				class="px-3 py-1 rounded-lg transition"
				class:bg-black={period === f}
				class:text-white={period === f}
				class:text-gray-400={period !== f}
				onclick={() => (period = f)}
			>
				{f}
			</button>
		{/each}
	</div>
</div>

<!-- <div class="p-4 rounded-[12px] border border-solid border-[#F1F5F9] bg-white mb-5 h-[260px]">
	
</div> -->
