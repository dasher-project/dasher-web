# Zooming Rules
This document is part of the Dasher Version Six Specification. It lays out the
rules that govern the positions and sizes of zoom boxes in a zooming user
interface.

These rules apply to the formal representations of boxes. They don't necessarily
apply to the visual representations. This is discussed a little more after the
rule descriptions.

Some terms used here are defined in earlier parts of the specification. See the
[previous section](../02BasicDefinitions/BasicDefinitions.md), and the
[table of contents](../).

## Zooming Rule Set Description
The rule set is as follows.

-   The **Size Map Rule** is that there is a deterministic mapping from box
    front position to box lateral size. The rule applies from position to size,
    but doesn't apply from size to position. Some outcomes of this rule are as
    follows.

    -   All boxes with the same front position have the same lateral size.

    -   In Dasher Version Six, and in general if the sequential forward
        direction is to the right:  
        All boxes with the same left position have the same height.
    
    In relation to a specific front position, the corresponding lateral size can
    be referred to as the **Mapped Size**.

-   The **Size Increase Rule** is that if the mapped size for a first front
    position is smaller that the mapped size for a second front position, then
    the first front position must be further forward than the second front
    position. Some outcomes of this rule are as follows.

    -   If one box has a smaller lateral size than another, then its front
        position will be further forward.

    -   In Dasher Version Six, and in general if the sequential forward
        direction is to the right:  
        If one box has a smaller height than another, then its front will be
        further to the right.

-   The **Minimum Size Rule** is that there is a front position for which the
    mapped size is the lowest mapped size of any possible front positions. This
    position can be referred to as the **Minimum Size Position**, and the
    corresponding mapped size can be referred to as the **Minimum Mapped Size**.
    Some outcomes of this rule and the size increase rule, above, are as
    follows.

    -   Any box whose front position is at, or further forward than, the minimum
        size position has the minimum mapped size.
    
    -   When a box is at the minimum size position and it moves in the reverse
        direction, its lateral size increases. If it continues to move in the
        reverse direction, its lateral size continues to increase.
    
    -   When a box is moving in the forward direction, its lateral size
        decreases until it reaches a minimum.

    -   In Dasher Version Six, and in general if the sequential forward
        direction is to the right:

        -   When a box is moving to the right, its height decreases until it
            reaches a minimum.
        
        -   If there are two boxes, one whose front is to the left of the other,
            then either both boxes have the minimum height, or the box to the
            left has a larger height.

## Zooming Rule Diagrams
The following diagram illustrates the Size Map Rule and the Size Increase Rule.

<picture>
    <source
        media="(prefers-color-scheme: dark)"
        srcset="SizeMapAndIncreaseRules_exported-dark.svg" >
    <img src="SizeMapAndIncreaseRules.svg">
</picture>

Notes on the diagram:

-   Size Map Rule: Boxes at the same position in the sequential dimension have
    the same size in the lateral dimension.
    
    The rule applies regardless of hierarchy. For example, Box 7 is a child of
    Box 6 but has the same size as Box 5, which is a sibling of Box 6.

-   Size Increase Rule: A box with a smaller lateral size is forward of a box
    with a larger lateral size.

## Zooming Rule Set Discussion
The visual representations of boxes in a zooming user interface don't
necessarily appear to follow the zooming rule set, see above. For example, in
Dasher Version Six the following apply.

There is a minimum height below which a box's rectangle won't be rendered, but
the box's text will still be rendered. The minimum render height is greater than
or equal to the minimum mapped size as defined by the minimum size rule, above.
This means that a shrinking box, i.e. a box moving to the right, will reach a
minimum render height, when its rectangle disappears but its text is still
rendered.

# Next Section
The next section in the specification is the
[Zooming Solver](../04ZoomingSolver/ZoomingSolver.md).

See also the [table of contents](../).

# Document Information
This document is part of the Dasher project and is under revision control here:  
[https://github.com/dasher-project/dasher-web](https://github.com/dasher-project/dasher-web)

(c) 2020 The ACE Centre-North, UK registered charity 1089313.  
MIT licensed, see [https://opensource.org/licenses/MIT](https://opensource.org/licenses/MIT)
