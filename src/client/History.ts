// // Subscribing can be enabled if we want reactivity
// export type Subscriber<HistoryState> = (stack: ReadonlyArray<HistoryState>, pointer: number) => void;
// 

export type HistoryState = { hash: string, index: number, view?: string }

class HistoryManager {
  private stack: HistoryState[] = [];
  // When pointer = -1, unset pointer; When pointer = -2, don't handle hashes
  private pointer = -1;
  // private subscribers = new Set<Subscriber<HistoryState>>();

  constructor() {
	  console.debug("HistoryManager: ", this);
  }

  // on navigation to a new page
  push(state: HistoryState) { 
    if (this.pointer < this.stack.length - 1) {
      this.stack.length = this.pointer + 1; // Replace branch
    }
    this.pointer = this.stack.length;
	state.index = this.pointer;
	
    this.stack.push(state);
	this.APIpush();
    // this.notify();
  }

  replace(state: HistoryState) {
	state.index = this.pointer;
    if (this.pointer >= 0) {
      this.stack[this.pointer] = state;
    } else {
      this.push(state);
    }
	
	this.APIreplace();
    // this.notify();
  }

  back(): HistoryState | undefined {
    if (this.pointer > 0) {
      this.pointer--;
      // this.notify();
	  this.APIreplace();
      return this.current;
    }
    return undefined;
  }

  forward(): HistoryState | undefined {
    if (this.pointer < this.stack.length - 1) {
      this.pointer++;
      // this.notify();
	  this.APIreplace();
      return this.current;
    }
    return undefined;
  }
  
  goto(idx: number): HistoryState | undefined {
    if (idx < 0 || idx >= this.stack.length) {
	  return undefined;
	}
	
	this.pointer = idx;
	this.APIreplace(); // Make sure to handle our final detination
	
	
	
	let recreatePointer = this.pointer;
	// Don't handle hashes while recreating and navigating history
	this.pointer = -2; 
	
	// Recreate lost history
	for (; recreatePointer + 1 < this.length - 1; recreatePointer--) {
		this.APIpush(this.stack[recreatePointer]);
	}
	// Navigate
	for (let i = this.length - 1; i > idx; i--) {
		history.back();
	}
	for (let i = 0; i < idx; i++) {
		history.forward();
	}
	
	this.pointer = idx;
	// this.notify();
	return this.current;
  }

  get current(): HistoryState | undefined {
    return this.stack[this.pointer] ?? { hash: "", index: 0 };
  }

  // read-only copy of the stack
  toArray(): ReadonlyArray<HistoryState> {
    return this.stack.slice();
  }

  get length(): number {
    return this.stack.length;
  }

  get index(): number {
    return this.pointer;
  }

  clear() {
    this.stack = [];
    this.pointer = -1;
    // this.notify();
  }
  
  private APIpush(state: HistoryState = this.current!): void {
	  const view = state.view ?? state.hash;
	  history.pushState(state, "", new URL(view, location.href));
  }
  
  private APIreplace(state: HistoryState = this.current!): void {
	  const view = state.view ?? state.hash;
	  history.replaceState(state, "", new URL(view, location.href));
  }
  
  

  // // subscribe to changes; returns an unsubscribe function
  // subscribe(fn: Subscriber<HistoryState>): () => void {
  // this.subscribers.add(fn);
  // // call immediately with snapshot
  // fn(this.toArray(), this.pointer);
  // return () => {
  //   this.subscribers.delete(fn);
  // };
  //

  // private notify() {
  //   const ROstack = this.toArray();
  //   const idx = this.pointer;
  //   for (const subscriber of Array.from(this.subscribers)) {
  //     try {
  //       subscriber(ROstack, idx);
  //     } catch (error) {
  //       console.error(`History subscriber encountered error: ${error}`);
  //     }
  //   }
  // }
  
}

declare global {
  interface Window { __historyManager__?: HistoryManager }
}



window.__historyManager__ = new HistoryManager();
export const historyManager = window.__historyManager__;
export default historyManager;