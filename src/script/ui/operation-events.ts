export const OPERATION_EVENTS = {
    play: 'doro:operation:play',
    toggleFullscreen: 'doro:operation:toggle-fullscreen',
    bulkSelect: 'doro:operation:bulk-select',
} as const;

export type OperationEventName = keyof typeof OPERATION_EVENTS;

export const dispatchOperation = (name: OperationEventName) => {
    window.dispatchEvent(new Event(OPERATION_EVENTS[name]));
};
