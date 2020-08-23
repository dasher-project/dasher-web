# Just notes




# Zoom Box Palette and Templates
This document is part of the Dasher Version Six Specification. It describes the palette and template


Some terms used here are defined in earlier parts of the specification. See the
[previous section](../04ZoomingSolver/ZoomingSolver.md) of the specification,
and the [table of contents](../).




Understanding the palette is a prerequisite to understanding spawning.


Structure of groups and non-groups.

# Palette
The order and structure of zoom boxes in the hierarchy is determined by a zoom
box **Palette**. The palette is a hierarchical tree structure with:

-   A single root node, referred to as the **Palette Root**.

-   Zero or more **Group** nodes. Each group node is either a child of the
    palette root, or the child of another group node. Each group node has a
    number of child nodes. Group nodes are never leaf nodes.

-   One ore more **Principal** nodes. Each principal node is either a child of
    the palette root, or the child of a group node. Principal nodes don't have
    child nodes. Principal nodes are always leaf nodes.

The child nodes of a node are ordered in the palette.

The Dasher Version Six proof-of-concept code has a single palette. In principle,
there could be a number of palettes and the user could select which to use.
Multiple palettes could improve support for multiple languages, for example.

## Palette Diagram
The following diagram shows a zoom box palette with the following
nodes.

-   Palette Root.
-   Principal nodes, A to G.
-   Group nodes, H and J.

![](PaletteHierarchy.svg)

Note that this is a simplified palette for the purposes of illustration. The
palette in the Dasher Version Six proof-of-concept has about seventy principal
nodes and five group nodes.

# Hierarchy Correspondence
The live zoom box hierarchy in the user interface will follow the structure of
the palette. Where the palette hierarchy reaches a leaf node but the live
hierarchy doesn't, the palette hierarchy will be repeated. The live leaf node
will take the place of the palette root in the repetition.

## Hierarchy Correspondence Diagram
The following diagram shows a live hierarchy based on the palette in the other
diagram. The palette hierarchy is repeated at:

-   The root of the live hierarchy.
-   The path: H, D.
-   The path: H, D, A.

![](HierarchyCorrespondence.svg)




-   **Principal** nodes have zoom box templates with incremental text. Principal
    nodes are always leaf nodes in the palette hierarchy. Vice versa, all leaf
    nodes are principal nodes.

-   **Group** nodes have zoom box templates that don't have incremental text.
    Group nodes are never leaf nodes; they always have child nodes.



It is similar
to the live zoom box hierarchy in the zooming user interface, with the following
differences.


The root, child, parent, and sibling terms apply equally to the palette
structure.



-   Each node in the palette hierarchy is a zoom box template. Each node in the
    live hierarchy is a zoom box.

-   The palette hierarchy is static and of limited depth. It has leaf nodes
    beyond which it doesn't extend. The live hierarchy is dynamic. A new
    hierarchy could be spawned under any current leaf node, depending on the
    actions of the user.

The live zoom box hierarchy in the user interface will follow the palette
structure. Beyond a live node that corresponds to a palette leaf node, the
palette hierarchy starts again from the root.



Each zoom box in the hierarchy can be based on a zoom box **Template**.

The template can provide values for some of the box's properties, such as the
incremental text and the rectangle colour.

In principle, a template can hold any property that:

-   Doesn't depend on the box's parent.
-   Doesn't depend on the box's position in the hierarchy.
-   Doesn't change after the zoom box has been created.




# Role of the Palette


The palette



The relative sizes of boxes in the hierarchy is determined by other factors,
outside the palette. Those factors are discussed later in the specification.




In principle, characters that are in the palette will always be present in every
level of the hierarchy. In practice, they may be too small to render. Characters
that aren't in the palette can still be present in the hierarchy.


# User Control
This document is part of the Dasher Version Six Specification. It describes ...


>   Maybe call it Run Time or Execution Cycle or Run Loop or Zooming Controller.


The zooming UI execution can be defined as a run loop in which the following
take place.

1.  Controller invocation trigger.

    In the Dasher Version Six proof-of-concept code, at time of writing, the
    controller is invoked every 400 milliseconds. In other words, the invocation
    trigger is that 0.4s have passed since the previous invocation.



>
>   Refer to "arrangement" in the run loop, not cascading. Or "parent solving"
>   and "child arrangement"

>   Spawning here? Adding and removing boxes.
>
>   Spawning starts with the root box. The root box is never removed. The root
>   box never leaves the zooming area.
>
>   A parent box can be trimmed when it has a child that is larger than the
>   zooming area limits.
>
>   The Back Rule is that the back of a box is at the zooming area limit.



# Pointer Terminology





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


-   Message Bar is where the working text is shown.

 When editing is finished, the working text becomes **Final Text**.




    The movement of the zoom boxes is controlled by the user, for example by
    positioning a **Pointer**. The location of the pointer can be represented
    by, for example, Cartesian X and Y co-ordinates.




# Viewer Terminology

Not all of a box gets drawn, necessarily.

Trailing edge always drawn at Solver Limit.

Something about not trimming or deleting boxes being necessary if they are to
appear in the viewer.

Colour Scheme, would be related to Palette.

# Technologies
Dasher Version Six is built on web technologies: HTML5, CSS,
JavaScript, and SVG.

>   Also Kotlin and Swift for mobile solutions. Also define Standalone vs
>   Browser vs Keyboard.




# Document Information
This document is part of the Dasher project and is under revision control here:  
[https://github.com/dasher-project/redash](https://github.com/dasher-project/redash)

(c) 2020 The ACE Centre-North, UK registered charity 1089313.  
MIT licensed, see [https://opensource.org/licenses/MIT](https://opensource.org/licenses/MIT)
