import {
	mdiReplyOutline,
	mdiPencil,
	mdiPinOutline,
	mdiContentCopy,
	mdiImage,
	mdiDownload,
	mdiCheckCircleOutline,
	mdiShareOutline,
	mdiDeleteOutline,
	mdiLinkVariant,
} from '@mdi/js';

type ContextMenuApplied = 'self' | 'selection' | 'text' | 'media' | 'file';

export interface ContextMenuItem {
	title: string;
	value: string;
	icon: string;
	appliedFor: 'all' | ContextMenuApplied | ContextMenuApplied[];
	inDevelopment?: boolean;
	color?: string;
}

export const contextMenuItems: ContextMenuItem[] = [
	{
		title: 'Reply',
		value: 'reply',
		icon: mdiReplyOutline,
		inDevelopment: true,
		appliedFor: 'all',
	},
	{
		title: 'Edit',
		value: 'edit',
		icon: mdiPencil,
		appliedFor: 'self',
	},
	{
		title: 'Pin',
		value: 'pin',
		icon: mdiPinOutline,
		inDevelopment: true,
		appliedFor: 'all',
	},
	{
		title: 'Copy selected text',
		value: 'copySelectedText',
		icon: mdiContentCopy,
		appliedFor: 'selection',
	},
	{
		title: 'Copy text',
		value: 'copyText',
		icon: mdiContentCopy,
		appliedFor: 'text',
	},
	{
		title: 'Copy image',
		value: 'copyImage',
		icon: mdiImage,
		appliedFor: 'media',
	},
	{
		title: 'Download',
		value: 'download',
		icon: mdiDownload,
		appliedFor: ['file', 'media'],
	},
	{
		title: 'Copy link',
		value: 'copyLink',
		icon: mdiLinkVariant,
		appliedFor: 'file',
	},
	{
		title: 'Forward',
		value: 'forward',
		icon: mdiShareOutline,
		inDevelopment: true,
		appliedFor: 'all',
	},
	{
		title: 'Select',
		value: 'select',
		icon: mdiCheckCircleOutline,
		inDevelopment: true,
		appliedFor: 'all',
	},
	{
		title: 'Delete',
		value: 'delete',
		icon: mdiDeleteOutline,
		color: 'text-deep-orange-accent-3',
		appliedFor: 'self',
	},
];
