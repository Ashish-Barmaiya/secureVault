/**
 * Enforces strict, one-way vault state transitions.
 *
 * Allowed Transitions:
 * - ACTIVE -> GRACE
 * - GRACE -> ACTIVE (Only via liveness proof)
 * - GRACE -> INHERITABLE
 * - INHERITABLE -> CLAIMED
 *
 * Forbidden:
 * - INHERITABLE -> ACTIVE
 * - INHERITABLE -> GRACE
 * - CLAIMED -> ACTIVE
 * - CLAIMED -> GRACE
 * - CLAIMED -> INHERITABLE
 *
 * @param {string} currentState
 * @param {string} targetState
 * @throws {Error} If the transition is illegal.
 */
export function validateVaultTransition(currentState, targetState) {
  if (currentState === targetState) return; // No change

  const allowed = {
    ACTIVE: ["GRACE"],
    GRACE: ["ACTIVE", "INHERITABLE"],
    INHERITABLE: ["CLAIMED"],
    CLAIMED: [], // Terminal state
  };

  if (!allowed[currentState] || !allowed[currentState].includes(targetState)) {
    throw new Error(
      `Illegal vault state transition: ${currentState} -> ${targetState}`
    );
  }
}
