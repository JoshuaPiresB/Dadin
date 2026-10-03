export const CLIENT_MESSAGES = {
  PLACE_DIE: "place_die",
  REQUEST_REMATCH: "request_rematch",
  DECLINE_REMATCH: "decline_rematch",
  PROPOSE_WAGER: "propose_wager",
  ACCEPT_WAGER: "accept_wager",
  DECLINE_WAGER: "decline_wager",
  LEAVE_MATCH: "leave_match",
} as const;

export const SERVER_MESSAGES = {
  MOVE_REJECTED: "move_rejected",
  NOTICE: "notice",
  REMATCH_DECLINED: "rematch_declined",
  WAGER_DECLINED: "wager_declined",
} as const;
