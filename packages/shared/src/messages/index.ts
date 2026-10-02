export const CLIENT_MESSAGES = {
  PLACE_DIE: "place_die",
  REQUEST_REMATCH: "request_rematch",
  DECLINE_REMATCH: "decline_rematch",
  LEAVE_MATCH: "leave_match",
} as const;

export const SERVER_MESSAGES = {
  MOVE_REJECTED: "move_rejected",
  NOTICE: "notice",
  REMATCH_DECLINED: "rematch_declined",
} as const;

