import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DialogService } from '../../core/dialog.service';
import { Icon } from '../icon/icon';
import { Modal } from '../modal/modal';

@Component({
  selector: 'app-dialog-host',
  imports: [Modal, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dialog-host.html',
  styleUrl: './dialog-host.css',
})
export class DialogHost {
  protected readonly dialogs = inject(DialogService);
}
