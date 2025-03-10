import type { Query } from '../types/query.js';
import type { ApplyQueryFields, CollectionType } from '../index.js';

export type WebSocketAuthModes = 'public' | 'handshake' | 'strict';

export interface WebSocketConfig {
	authMode?: WebSocketAuthModes;
	reconnect?:
		| {
				delay: number; // in ms
				retries: number;
		  }
		| false;
	heartbeat?: boolean;
	url?: string;
}

export interface SubscribeOptions<Schema extends object, Collection extends keyof Schema> {
	event?: SubscriptionOptionsEvents;
	query?: Query<Schema, Schema[Collection]>;
	uid?: string;
}

export type WebSocketEvents = 'open' | 'close' | 'error' | 'message';
export type RemoveEventHandler = () => void;
export type WebSocketEventHandler = (this: WebSocket, ev: Event | CloseEvent | any) => any;

export interface WebSocketClient<Schema extends object> {
	connect(): Promise<void>;
	disconnect(): void;
	onWebSocket(event: 'open', callback: (this: WebSocket, ev: Event) => any): RemoveEventHandler;
	onWebSocket(event: 'error', callback: (this: WebSocket, ev: Event) => any): RemoveEventHandler;
	onWebSocket(event: 'close', callback: (this: WebSocket, ev: CloseEvent) => any): RemoveEventHandler;
	onWebSocket(event: 'message', callback: (this: WebSocket, ev: any) => any): RemoveEventHandler;
	onWebSocket(event: WebSocketEvents, callback: WebSocketEventHandler): RemoveEventHandler;
	sendMessage(message: string | Record<string, any>): void;
	subscribe<Collection extends keyof Schema, Options extends SubscribeOptions<Schema, Collection>>(
		collection: Collection,
		options?: Options
	): Promise<{
		subscription: AsyncGenerator<
			SubscriptionOutput<
				Schema,
				Collection,
				Options['query'],
				Fallback<Options['event'], SubscriptionOptionsEvents> | 'init'
			>,
			void,
			unknown
		>;
		unsubscribe(): void;
	}>;
}

type Fallback<Selected, Options> = Selected extends Options ? Selected : Options;
export type SubscriptionOptionsEvents = 'create' | 'update' | 'delete';
export type SubscriptionEvents = 'init' | SubscriptionOptionsEvents;

export type SubscriptionOutput<
	Schema extends object,
	Collection extends keyof Schema,
	TQuery extends Query<Schema, Schema[Collection]> | undefined,
	Events extends SubscriptionEvents,
	TItem = TQuery extends Query<Schema, Schema[Collection]>
		? ApplyQueryFields<Schema, CollectionType<Schema, Collection>, TQuery['fields']>
		: Partial<Schema[Collection]>
> = { type: 'subscription' } & {
	[Event in Events]: SubscriptionPayload<TItem>[Event];
}[Events];

export type SubscriptionPayload<Item> = {
	init: Item[];
	create: Item[];
	update: Item[];
	delete: string[] | number[];
};
