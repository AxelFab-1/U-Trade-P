import { Component } from '@angular/core';

@Component({
  selector: 'app-explorar',
  imports: [],
  templateUrl: './explorar.html',
  styleUrl: './explorar.scss',
})
export class Explorar {
  activeTab: string = 'Producto';

  setActiveTab(tab: string) {
    this.activeTab = tab;
  }
}
