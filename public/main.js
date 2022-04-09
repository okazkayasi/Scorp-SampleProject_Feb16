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
      if (
        new Date().getTime() >
        new Date(non_animation_queue[0].timestamp).getTime() +
          MESSAGE_TIMEOUT_SEC * 1000
      ) {
        console.log("here", new Date(), non_animation_queue[0].timestamp);
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
  console.log(animation_queue.length, non_animation_queue.length);
  let animation_works = true;
  if (animation_queue.length > 0) {
    if (isPossiblyAnimatingGift() && isAnimatingGiftUI()) {
      animation_works = false;
    } else {
      animateGift(animation_queue[0]);
      animation_queue.shift();
    }
  } else {
    animation_works = false;
  }
  if (!animation_works) {
    sendMessage();
  }
};

setInterval(() => {
  handleEventQueue();
}, 500);

api.setEventHandler((events) => {
  // filter out duplicate events
  events = events.filter((event, index, self) => {
    return (
      index ===
      self.findIndex((t) => {
        return t.id === event.id;
      })
    );
  });

  // filter animations
  const animation_events = events.filter(
    (ev) => ev.type === API_EVENT_TYPE.ANIMATED_GIFT
  );
  const non_animation_events = events.filter(
    (ev) => ev.type !== API_EVENT_TYPE.ANIMATED_GIFT
  );
  animation_queue.push(...animation_events);
  non_animation_queue.push(...non_animation_events);
});

// NOTE: UI helper methods from `dom_updates` are already imported above.
