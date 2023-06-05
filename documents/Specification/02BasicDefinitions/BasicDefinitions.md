# Basic Definitions
This document is part of the Dasher Version Six Specification. It defines and
illustrates basic terms that are used in the specification.

See also the
[previous section](../01ZoomingUserInterface/ZoomingUserInterface.md) of the
specification, and the [table of contents](../).

## Zoom Box Terms
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
    
        The rectangle of a zoom box never overlaps with any of the rectangles of
        any sibling box.
    
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

## Text Terms
One application of the zooming user interface, see above, is text entry. Text
entry in a zooming user interface can be described in the following terms.

-   There is a **Working Text** that the user is editing. The working text is
    sometimes called the message but that term isn't used in this discussion.

-   Every zoom box has a **Box Text**. The box text can be empty. The root box
    text is empty.

-   If there is a zoom box that is across the origin, see above, its box text
    will be the working text.
    **That is a fundamental feature of the zooming user interface.**

    When the zoom boxes move so that a different box is across the origin, the
    working text changes to the text of that box.

    If there isn't a zoom box that is across the origin, then the working text
    is empty.

-   A zoom box can have **Incremental Text**, in addition to its box text.

    -   If a box has incremental text, then its box text will be its incremental
        text appended to the box text of its parent.
    
    -   If a box doesn't have incremental text, then its box text will be the
        same as the box text of its parent.
    
    In Dasher Version Six at time of writing, incremental texts are always
    single characters.
    
-   Zoom boxes without incremental text could be used for either of the
    following purposes, for example.

    -   As a **Group** for their child boxes. For example, boxes with
        incremental texts that are numerals, 0 to 9, are in a separate group to
        boxes with incremental texts that are capital letters, A to Z.
    
    -   To enable the user to select an **Action** within a zooming interaction.
        For example, sending the working text to a speech synthesis function.
        Dasher Version Six doesn't support action boxes at time of writing.

## Dimension Terms
The zooming area of a zooming user interface, see above, is two-dimensional. The
following terms can be used in descriptions.

-   The two dimensions can be referred to:

    -   As horizontal and vertical.
    -   In Cartesian terms, as X and Y.
    -   In lay terms, as left-right and up-down.

-   In the zooming area of a zooming user interface, one dimension will be
    designated as the **Sequential Dimension**.

    In some versions of Dasher, the user can select which dimension is
    designated as the sequential dimension. In the Dasher Version Six user
    interface at time of writing, horizontal is designated as the sequential
    dimension and the user cannot change it.

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

    In some versions of Dasher, the user can change which select whether
    positive or negative is designated as the sequential forward direction. In
    the Dasher Version Six user interface at time of writing, the sequential
    forward direction is Cartesian positive X, which is to the right.

-   The opposite to the forward direction in the sequential dimension is always
    designated as the **Reverse** direction.

    In the Dasher Version Six user interface at time of writing, the sequential
    reverse direction is Cartesian negative X, which is to the left.

## Position and Size Terms
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

## Diagram for Zoom Box Terms and Text Terms
The following diagram illustrates some of the terms defined above. It is based
on a screen capture image of the Dasher Version Six zooming area.

<picture>
    <source
        media="(prefers-color-scheme: dark)"
        srcset="ZoomBoxTerminology_exported-dark.svg" >
    <img src="ZoomBoxTerminology.svg">
</picture>

Notes on the diagram:

-   In generic terms:

    -   Left is the Front Position.
    -   Middle is the Lateral Centre.
    -   Height is the Lateral Size.

-   There are sibling boxes in between "ha" and "he": "hb", "hc", and "hd". They
    were too small to render at the time of capture. The same is true of sibling
    boxes in between "he" and "hi".

-   ZoomBox outlines have been switched on, for clarity. Outlines aren't shown
    by default.

## Diagram for Dimension Terms, and Position and Size Terms
The following diagram illustrates some of the terms defined above.

<picture>
    <source
        media="(prefers-color-scheme: dark)"
        srcset="DimensionTerminology_exported-dark.svg" >
    <img src="DimensionTerminology.svg">
</picture>

In this diagram, the lateral and sequential dimensions, and the forward and
reverse directions, reflect the Dasher Version Six user interface designations.

# Next Section
The next section in the specification is the
[Zooming Rules](../03ZoomingRules/ZoomingRules.md).

See also the [table of contents](../).

# Document Information
This document is part of the Dasher project and is under revision control here:  
[https://github.com/dasher-project/dasher-web](https://github.com/dasher-project/dasher-web)

(c) 2020 The ACE Centre-North, UK registered charity 1089313.  
MIT licensed, see [https://opensource.org/licenses/MIT](https://opensource.org/licenses/MIT)
