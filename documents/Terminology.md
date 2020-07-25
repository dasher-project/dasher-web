# Dasher Version Six Terminology

**Just notes at this time**

Dasher Version Six is an implementation of the Dasher zooming text entry system.

The following terms are used with the following meanings in the Dasher Version
Six project documentation.

>   Maybe call it a specification instead.


# Zooming User Interface Description
A zooming user interface is one that can be described in the following terms.

-   There is a two-dimensional space, the **Zooming Area**. Points in the
    zooming area can be represented by, for example, Cartesian X and Y
    co-ordinates.

-   The zooming area is a rectangular portion of an, in principle, infinite
    space. The edges of the zooming area can be referred to as the
    **Zooming Area Limits**, or just as the limits if this is obvious from
    context.

-   There will be a number of rectangles in the zooming area. A rectangle can be
    referred to as a **Zoom Box**, or just as a box if this is obvious from
    context.

    Zoom boxes can move and change size. Zoom boxes don't rotate however and the
    sides of all zoom box rectangles are always parallel to the sides of the
    zooming area. 

-   The zooming area and zoom boxes can have different representations.

    -   The **Formal** representation could be a data structure with a
        collection of parameters and values.
    
    -   The **Visual** representation could be how it appears in the user
        interface.
    
-   The zooming area has a designated **Origin** point. The origin can be
    represented by the Cartesian co-ordinates (0, 0) for example.

    The origin isn't necessarily at the visual centre of the zooming area. The
    zooming area limits can be expressed as the distances from the origin to
    each of its four edges.

-   The **User** controls the movement of zoom boxes in the zooming area. The
    user can also specify preference **Settings**, for example in a control
    panel section of the user interface.
    
# Zoom Box Terms
Zoom boxes in a zooming user interface, see above, can be described in the
following terms.

-   There is a **Zoom Box Hierarchy**, as follows.

    -   There is a single **Root Box** at the top of the hierarchy.
    
    -   Every zoom box other than the root has exactly one **Parent Box**.
    
        The rectangle of a zoom box will always be entirely within the rectangle
        of its parent box.
    
    -   In relation to its parent box, a zoom box can be referred to as a
        **Child Box**. A box can be the parent box to zero, one, or more than
        one child boxes.

    -   In relation to another box with the same parent, a zoom box can be
        referred to as a **Sibling Box**.
    
    -   Every zoom box has a numeric **Level**. The root box has level zero.
        Every other zoom box has a level of one more than the level of its
        parent.

-   Zoom boxes move; the origin doesn't move. The origin might, at any time be
    inside one or more zoom box rectangles. The hierarchical structure of the
    zoom boxes means that:
    
    -   If the origin is inside a zoom box, the origin will also be inside its
        parent box.
    
    -   If the origin is inside a zoom box, the origin won't be inside any of
        its sibling boxes.
    
    A zoom box can be described as **Across The Origin** if it meets all the
    following conditions.

    -   The origin is inside the zoom box's rectangle.

    -   The origin isn't inside any of the zoom box's child boxes' rectangles.

    Put another way, the zoom box with the highest level number that contains
    the origin is the box that is described as being across the origin.

# Text Terms
One application of the zooming user interface, see above, is text entry. Text
entry in a zooming user interface can be described in the following terms.

-   There is a **Working Text** that the user is editing. The working text is
    sometimes called the message but that term isn't used in this discussion.

-   Every zoom box has an associated text, referred to as its **Box Text**. Box
    texts can be empty. The root box text is empty.

-   Some zoom boxes have an associated **Incremental Text** in addition to their
    box text.

    -   If a box has an incremental text, then its box text will be its
        incremental text appended to the box text of its parent.
    
    -   If a box doesn't have an incremental text, then its box text will be the
        same as the box text of its parent.
    
    In Dasher Version Six at time of writing, incremental texts are always
    single characters.
    
-   If there is a zoom box that is across the origin, see above, its box text
    will be the working text.
    **That is a fundamental feature of the zooming user interface.**

    When the zoom boxes move so that a different box is across the origin, the
    working text changes to the text of that box.

    If there isn't a zoom box that is across the origin, then the working text
    is empty.

-   Zoom boxes without an incremental text could be used for either of the
    following purposes, for example.

    -   As a **Group** for their child boxes. For example, boxes with
        incremental texts that are numerals, 0 to 9, are in a separate group to
        boxes with incremental texts that are capital letters, A to Z.
    
    -   To enable the user to select an action within a zooming interaction. For
        example, sending the working text to a speech synthesis function. Dasher
        Version Six doesn't support action boxes at time of writing.

# Dimension Terms
The zooming area of a zooming user interface, see above, is two-dimensional. The
following terms can be used in descriptions.

-   The two dimensions can be referred to:

    -   As horizontal and vertical.
    -   In Cartesian terms, as X and Y.
    -   In lay terms, as left-right and up-down.

-   In the zooming area of a zooming user interface, one dimension will be
    designated as the **Sequential Dimension**.

    In the Dasher Version Six user interface at time of writing, horizontal is
    designated as the sequential dimension.

    In some other versions of Dasher, the user can select which dimension is
    designated as the sequential dimension.

-   The other dimension, which will be perpendicular to the sequential
    dimension, is always designated as the **Lateral Dimension**.

    In the Dasher Version Six user interface at time of writing, vertical is
    always designated as the lateral dimension.

-   The line that passes through the origin and is parallel to the sequential
    dimension can be referred to as the **Sequential Axis**.

-   The line that passes through the origin and is parallel to the lateral
    dimension can be referred to as the **Lateral Axis**.

-   In the sequential dimension, one direction will be designated as the
    **Forward** direction.

    In the Dasher Version Six user interface at time of writing, the sequential
    forward direction is Cartesian positive X, which is to the right.

    In some other versions of Dasher, the user can select whether positive or
    negative is designated as the sequential forward direction.

-   The opposite to the forward direction in the sequential dimension is always
    designated as the **Reverse** direction.

    In the Dasher Version Six user interface at time of writing, the sequential
    reverse direction is Cartesian negative X, which is to the left.

# Position and Size Terms
The position and size of a zoom box in a zooming user interface, see above, can
be described in the following terms.

A zoom box rectangle has four sides:

-   Two sides, referred to as the **Front** and the **Back**, will be
    perpendicular to the sequential axis. By definition: a vector from the
    middle of the front to the middle of the back would be parallel to the
    sequential axis and in the forward direction.

    The distance from the origin to the front side, in the sequential forward
    direction, can be referred to as the **Front Position** of the zoom box.

-   The other two sides will be perpendicular to the lateral axis.

    The distance between these sides can be referred to as the **Lateral Size**.
    The lateral size is a scalar value, i.e. it is unsigned.

    The distance from the origin to a midpoint between these sides, in the
    lateral dimension can be referred to as the **Lateral Centre**.

# Zooming Rules
The positions and sizes of zoom boxes in a zooming user interface, see above,
conform to a set of rules.
**That is a fundamental feature of Dasher Version Six.**

These rules apply to the formal representations of boxes. They don't necessarily
apply to the visual representations. This is discussed a little more after the
rule descriptions.

## Zooming Rule Set Description
The rule set is as follows.

-   The **Size Map Rule** is that there is a deterministic mapping from box
    front position to box lateral size. The rule applies from position to size,
    but doesn't apply from size to position. Some outcomes of this rule are as
    follows.

    -   All boxes with the same front position have the same lateral size.

    -   In Dasher Version Six, and in general if the sequential forward direction
        is to the right:  
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
        If one box has a smaller height than another, then its front position
        will be further to the right.

-   The **Minimum Size Rule** is that there is a front position for which the
    mapped size is the lowest mapped size of all front positions. This position
    can be referred to as the **Minimum Size Position**, and the corresponding
    mapped size can be referred to as the **Minimum Mapped Size**. Some outcomes
    of this rule and the size increase rule, above, are as follows.

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






The rules can be stated in relative terms, supposing that there are two zoom
boxes, as follows.


-   If one box has a front position that is further forward than the other, then
    either of the following will be true.

    -   The box that is further forward has a smaller lateral size than the
        other box.

    -   Both boxes have a lateral size of zero.

The rules can instead be stated in terms of a single box that moves, as follows.

-   There is a front position at which a box has a lateral size of zero,
    referred to as the **Zero Position**.

-   If a box's moves further in 

-   The lateral size of a box increases as its front moves in the reverse
    direction, and decreases as its front moves in the forward direction.







-   Each rule is stated first in generic terms, then as it applies in Dasher
    Version Six at time of writing.





-   All boxes with the same front position have the same lateral size.


    
    In Dasher Version Six and in general if the sequential forward direction is
    to the right: Boxes increase in height as they move to the left, and
    decrease in height as they move to the right.

-   



-   There is a front position at which the lateral size of a box would be zero.







>   Spawning here?
>
>   Spawning starts with the root box. The root box is never removed.
>
>   A parent box can be trimmed when it has a child that is larger than the
>   zooming area limits.




# Pointer and Solver Terminology


    **That is a fundamental feature of Dasher Version Six.**




# Size and Position Rules
The sizing rules of the solver are:


-   Solved size.

    >   definition goes here


-   Solver Zero.

    The position in the sequential dimension at which the solved size in the
    lateral dimension is zero. Positions


-   Solver Algorithm.

    >   User could choose.  
    >   Square solver: lateral size is equal to distance between the sequential
    >   position and Solver Zero.



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

 When editing is finished, the working text becomes **Final Text**.




    The movement of the zoom boxes is controlled by the user, for example by
    positioning a **Pointer**. The location of the pointer can be represented
    by, for example, Cartesian X and Y co-ordinates.




# Viewer Terminology

Not all of a box gets drawn, necessarily.

Trailing edge always drawn at Solver Zero.


Colour Scheme, would be related to Palette.

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
