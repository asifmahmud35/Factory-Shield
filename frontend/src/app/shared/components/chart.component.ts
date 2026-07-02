import {
  Component, ElementRef, OnDestroy, afterNextRender, effect, input, viewChild,
} from '@angular/core';
import ApexCharts, { ApexOptions } from 'apexcharts';

/**
 * Thin standalone wrapper around the framework-agnostic `apexcharts` core.
 *
 * We deliberately avoid the `ng-apexcharts` wrapper: it declares an Angular
 * >=20 peer dependency and this app is on Angular 19, so importing it risks
 * runtime/version breakage. Driving the core library directly is a handful of
 * lines and version-proof.
 */
@Component({
  selector: 'app-chart',
  standalone: true,
  template: `<div #host class="chart-host"></div>`,
  styles: [`
    :host, .chart-host { display:block; width:100%; }
  `],
})
export class ChartComponent implements OnDestroy {
  readonly options = input.required<ApexOptions>();
  private host = viewChild.required<ElementRef<HTMLDivElement>>('host');

  private chart?: ApexCharts;
  private ready = false;

  constructor() {
    // Only touch the DOM once the view exists; afterNextRender runs
    // browser-side only, which is exactly where ApexCharts can render.
    afterNextRender(() => {
      this.ready = true;
      this.renderOrUpdate(this.options());
    });

    effect(() => {
      const opts = this.options();
      if (this.ready) this.renderOrUpdate(opts);
    });
  }

  private renderOrUpdate(opts: ApexOptions): void {
    if (this.chart) {
      this.chart.updateOptions(opts, true, true);
      return;
    }
    this.chart = new ApexCharts(this.host().nativeElement, opts);
    this.chart.render();
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
    this.chart = undefined;
  }
}
