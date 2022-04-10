// @ts-check

import { APIWrapper, API_EVENT_TYPE } from "./api.js";
import {
  addMessage,
  animateGift,
  isPossiblyAnimatingGift,
  isAnimatingGiftUI,
} from "./dom_updates.js";

const api = new APIWrapper();

const MESSAGE_TIMEOUT_SEC = 20;
const non_animation_queue = [];
const animation_queue = [];

const sendMessage = () => {
  if (non_animation_queue.length > 0) {
    if (non_animation_queue[0].type == API_EVENT_TYPE.MESSAGE) {
      // if message is older than 20 sec, we'll skip it.
      if (
        new Date().getTime() >
        new Date(non_animation_queue[0].timestamp).getTime() +
          MESSAGE_TIMEOUT_SEC * 1000
      ) {
        non_animation_queue.shift();
        sendMessage();
        return;
      }
    }
    addMessage(non_animation_queue[0]);
    non_animation_queue.shift();
  }
};

const handleEventQueue = () => {
  let animation_has_priority = true;
  if (animation_queue.length > 0) {
    if (isPossiblyAnimatingGift() && isAnimatingGiftUI()) {
      // animation can't work now, so we'll let other events go.
      animation_has_priority = false;
    } else {
      animateGift(animation_queue[0]);
      animation_queue.shift();
    }
  } else {
    // there's no animation in queue, so we'll let other events go.
    animation_has_priority = false;
  }
  if (!animation_has_priority) {
    sendMessage();
  }
};

setInterval(() => {
  handleEventQueue();
}, 500);

api.setEventHandler((events) => {
  // filter out duplicate events
  const non_duplicate_events = events.filter((event, index, self) => {
    return (
      index ===
      self.findIndex((t) => {
        return t.id === event.id;
      })
    );
  });

  // filter animations
  const animation_events = non_duplicate_events.filter(
    (ev) => ev.type === API_EVENT_TYPE.ANIMATED_GIFT
  );
  const non_animation_events = non_duplicate_events.filter(
    (ev) => ev.type !== API_EVENT_TYPE.ANIMATED_GIFT
  );
  animation_queue.push(...animation_events);
  non_animation_queue.push(...non_animation_events);
});

// NOTE: UI helper methods from `dom_updates` are already imported above.
