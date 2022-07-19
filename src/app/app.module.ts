import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { HelloComponent } from './hello.component';

// flex-layout
import { FlexLayoutModule } from '@angular/flex-layout';


// material 
import { MatButtonModule } from '@angular/material/button';

@NgModule({
  imports:      [ 
    BrowserModule,
    FormsModule,
    FlexLayoutModule,
    MatButtonModule, ],
  declarations: [ AppComponent, HelloComponent ],
  bootstrap:    [ AppComponent ]
})
export class AppModule { }
