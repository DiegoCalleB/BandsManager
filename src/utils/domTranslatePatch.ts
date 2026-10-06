/**
 * Fix for Google Translate / Browser Extensions DOM Mutation Conflict with React.
 *
 * Problem: Google Translate modifies the DOM by inserting <font> tags around text nodes.
 * When React tries to update or re-order DOM nodes (e.g. icons next to text), it calls
 * `parent.insertBefore(newNode, referenceNode)` or `parent.removeChild(childNode)`.
 * If Google Translate has moved or replaced the referenceNode, native DOM throws:
 * "NotFoundError: Failed to execute 'insertBefore' on 'Node': The node before which the new node is to be inserted is not a child of this node."
 *
 * Solution: Monkey-patch Node.prototype.insertBefore and Node.prototype.removeChild to safely
 * fall back instead of throwing an uncaught exception that crashes the React tree.
 */

if (typeof window !== 'undefined' && typeof Node === 'function' && Node.prototype) {
  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function <T extends Node>(child: T): T {
    if (child.parentNode !== this) {
      if (typeof console !== 'undefined' && console.warn) {
        console.warn('[DOM Patch] Node.removeChild: child is not a direct child of parent. Handled gracefully.', child, this);
      }
      return child;
    }
    return originalRemoveChild.call(this, child) as T;
  };

  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function <T extends Node>(newNode: T, referenceNode: Node | null): T {
    if (referenceNode && referenceNode.parentNode !== this) {
      if (typeof console !== 'undefined' && console.warn) {
        console.warn('[DOM Patch] Node.insertBefore: referenceNode is not a direct child of parent. Appending instead.', referenceNode, this);
      }
      return this.appendChild(newNode) as T;
    }
    return originalInsertBefore.call(this, newNode, referenceNode) as T;
  };
}

export {};
