"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.textCreationSession = void 0;
class TextCreationSession {
    current = null;
    nextId = 0;
    listeners = new Set();
    getSnapshot = () => this.current;
    subscribe = (listener) => {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    };
    start({ placement, point, targetObjectId, targetObjectType, }) {
        this.nextId += 1;
        this.current = {
            id: this.nextId,
            point,
            ...(placement ? { placement } : {}),
            ...(targetObjectId ? { targetObjectId } : {}),
            ...(targetObjectType ? { targetObjectType } : {}),
        };
        this.emit();
    }
    cancel() {
        if (!this.current) {
            return;
        }
        this.current = null;
        this.emit();
    }
    complete() {
        this.cancel();
    }
    emit() {
        this.listeners.forEach((listener) => listener());
    }
}
exports.textCreationSession = new TextCreationSession();
