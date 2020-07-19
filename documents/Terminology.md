# Dasher Version Six Terminology

**Just notes at this time**

Dasher Version Six is an implementation of the Dasher zooming text entry system.

The following terms are used with the following meanings in the Dasher Version
Six project documentation.




# Dasher Terminology
The Dasher zooming text entry system can be described in the following terms.

-   There is a **Working Text** that the user is editing. When editing is
    finished, the working text becomes **Final Text**.

-   There is a two-dimensional space, the **Zooming Area**. Points in the
    zooming area can be represented by, for example, Cartesian X and Y
    co-ordinates.

    The zooming area is a rectangular portion of an, in principle, infinite
    space.

-   The zooming area has a designated **Origin** point. The origin can be
    represented by the Cartesian co-ordinates (0, 0) for example.

    The origin isn't necessarily at the centre of the zooming area.

-   There will be a number of rectangles in the zooming area. A rectangle can be
    referred to as a **Zoom Box**, or just as a box if this is obvious from
    context.

    Zoom box rectangles can move and change size. The sides of all zoom box
    rectangles are always parallel to the sides of the zooming area. Zoom boxes
    don't rotate.

    The **Visual Representation** of a zoom box in the user interface can differ
    from its **Formal Representation**.




    The movement of the zoom boxes is controlled by the user, for example by
    positioning a **Pointer**. The location of the pointer can be represented
    by, for example, Cartesian X and Y co-ordinates.




-   Zoom boxes are hierarchical.

    -   There is a single **Root Box** at the top of the hierarchy.
    
    -   Apart from the root box, each zoom box has exactly one **Parent Box**.
        The rectangle of a box will always be entirely within the rectangle of
        its parent box.
    
    -   In relation to its parent box, a zoom box can be referred to as a
        **Child Box**. A box can be the parent box to zero, one, or more than
        one child boxes.

    -   In relation to another box with the same parent, a zoom box can be
        referred to as a **Sibling Box**.
    
    -   Each zoom box has a numeric **Level**. The root box has level zero.
        Every other zoom box has a level of one more than the level of its
        parent.

-   Each zoom box has an associated text, referred to as its **Box Text**. Box
    texts can be empty. The root box text is empty.

-   Some zoom boxes have an associated **Incremental Text**.

    -   If a box has an incremental text, then its box text is its incremental
        text appended to the box text of its parent.
    
    -   If a box doesn't have an incremental text, then its box text is the same
        as the box text of its parent.
    
    A zoom box that doesn't have an associated text can be referred to as a
    **Group** box.

-   Zoom boxes move; the origin doesn't move. The origin might, at any time be
    inside one or more zoom box rectangles. The hierarchical structure of the
    zoom boxes means that, if the origin is inside a zoom box, the origin will
    also be inside its parent box. A zoom box can be described as
    **Across The Origin** if it meets all the following conditions.

    -   The origin is inside the zoom box's rectangle.

    -   The origin isn't inside any of the zoom box's child boxes' rectangles.

    Put another way, the zoom box with the highest level number that contains
    the origin is the box that is described as being across the origin.


>   Spawning here?





# Pointer and Solver Terminology


-   Sequential Dimension.

    The Cartesian X dimension, left-right, by default.

-   Sequential Positive Direction.

-   Sequential Negative Direction.

-   Lateral Dimension.

    Perpendicular to the sequential dimension.

    The Cartesian Y dimension, up-down, by default.


# Box Terminology

-   Leading Edge.

    Parallel to the lateral axis. Leading edge position in the sequential
    dimension.

-   Sequential Position.

-   Lateral Size.

-   Lateral Centre.



# Size and Position Rules
The sizing rules of the solver are:

-   Boxes with the same position in the sequential dimension have the same size
    in the lateral dimension.

    In the default setup: boxes with the same left-right position have the same
    height.

-   Solved size.

    >   definition goes here

-   Solved size in the lateral dimension decreases as position in the sequential
    dimension increases, and vice versa.

    In the default setup: the solved size decreases to the right.

-   Solver Zero.

    The position in the sequential dimension at which the solved size in the
    lateral dimension is zero. Positions


-   Solver Algorithm.

    >   User could choose.  
    >   Square solver: lateral size is equal to distance between the sequential
    >   position and Solver Zero.



-   Sequential Axis.

    The line that passes through the origin and is parallel to the sequential
    dimension.

-   Lateral Axis.

    The line that passes through the origin and is parallel to the lateral
    dimension.

-   Forward Motion.

    -   Text could be added to the end of the working text.
    -   Zoom boxes are increasing in size.

    Occurs when the pointer is in front of the origin in the sequential
    dimension.

-   Reverse Motion.

    -   Text could be removed from end of the working text.
    -   Zoom boxes are decreasing in size.

    Occurs when the pointer is behind the origin in the sequential dimension.


-   Lateral Motion.

    -   Text could be changing at the end of the working text.
    -   Zoom boxes are moving in the lateral dimension.

    Occurs when the pointer isn't on the lateral axis.

-   Solver Zero.

    The boundary beyond which the solver would give a box zero height.



-   Message Bar is where the working text is shown.


# Viewer Terminology

Not all of a box gets drawn, necessarily.

Trailing edge always drawn at Solver Zero.


# Technologies
Dasher Version Six is built on web technologies: HTML5, CSS,
JavaScript, and SVG.

>   Also Kotlin and Swift for mobile solutions. Also define Standalone vs
>   Browser vs Keyboard.




# Document Information
This diagram is part of the Dasher project and is under revision control here:  
[https://github.com/dasher-project/redash/tree/master/documents](https://github.com/dasher-project/redash/tree/master/documents)

(c) 2020 The ACE Centre-North, UK registered charity 1089313.  
MIT licensed, see [https://opensource.org/licenses/MIT](https://opensource.org/licenses/MIT)
