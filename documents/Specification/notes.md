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

Node paths are numbered from one in the diagram. Index values are zero-based in
the code.

Note that this is a simplified palette for the purposes of illustration. The
palette in the Dasher Version Six proof-of-concept has about seventy principal
nodes and five group nodes.

# Hierarchy Correspondence
The live zoom box hierarchy in the user interface will follow the structure of
the palette. Where the palette hierarchy reaches a leaf node but the live
hierarchy doesn't, the palette hierarchy will be repeated. The live zoom box
will then take the place of the palette root in the repetition.

A live zoom box can be described as having a **correspondence** with a palette
node that is in the same position in the hierarchy.

In the case that the palette hierarchy is repeated, the zoom box at the root of
the repetition could in theory be said to have a correspondence with both the
palette root and with a palette leaf node. In practice, the zoom box will in
general be treated as having a correspondence with the leaf node. Only the live
root will in general be treated as having a correspondence with the palette
root. 

Note that it's possible for the live hierarchy to have zoom boxes that don't
correspond to any node in the palette. In other words, not every zoom box
necessarily corresponds to a palette node. Non-corresponding zoom boxes are
needed, for example, to support the case that a character that isn't in the
palette is returned by a language prediction model. This is discussed elsewhere
in the specification.

## Hierarchy Correspondence Diagram
The following diagram shows a live hierarchy based on the palette in the other
diagram.

![](HierarchyCorrespondence.svg)

The palette hierarchy is repeated at:

-   The root of the live hierarchy.
-   The path: 4, 1.
-   The path: 4, 1, 1.

Some examples of node correspondence shown in the diagram are as follows.

-   Live node at path 4, 1, 1, 3 corresponds to palette node at path 3.
-   Live node at path 4, 1, 5, 2 corresponds to the palette node at path 5, 2.

# Text in the Palette
Some palette nodes have associated text, as follows.

-   Each principal node in the palette hierarchy has an associated text,
    referred to as its **Template Text**.

-   The palette root and group nodes don't have associated text.

(In the Dasher Version Six proof-of-concept, the template text is always a single
letter, numeral, punctuation mark, symbol, space, newline, or other character.
Unicode representation is used throughout.)

There is a relationship between incremental text in a zoom box and the palette
node with which the box has a correspondence, as follows.

-   If the box corresponds to a principal node, then the box's incremental text
    will be the node's template text.

-   If the box corresponds to a group node, then the box won't have incremental
    text.

-   If the box is the live root, then it won't have incremental text.

-   If the zoom box doesn't correspond to any palette node, then its incremental
    text will be something that isn't in the palette.

# Colours
Some palette nodes specify a **Symbolic Colour**, as follows.

-   Each group node specifies a symbolic colour, referred to as its 
    **Template Colour**.

-   The palette root and principal nodes don't specify a symbolic colour.

Each zoom box has a **Colour Specifier**. There is a relationship between the
colour specifier of a zoom box and the palette node with which the box has a
correspondence, as follows.

-   If the box corresponds to a group node, then the box's colour specifier will
    be the node's template colour.

-   Otherwise, the box's colour specifier will depend on its position in the
    live hierarchy. This type of colour specifier is referred to as a
    **Sequence Colour**. See below for a discussion of sequence colours.

If a zoom box is drawn, its colour specifier will be used to determine the
colour with which its rectangle is filled, referred to as the
**Display Colour**. There is a mapping from colour specifiers to display
colours. The mapping has default values, and can be changed by the end user, for
example in a control panel user interface.

## Sequence Colours
The sequence colours system is intended to ensure the following.

-   The rectangle of a parent zoom box is never the same colour as any of its
    child boxes.

-   The rectangles of adjacent sibling zoom boxes are never the same colour.

The colour specifier of a sequence colour has the following parts.

-   **Stub**, a fixed text.
-   **Ordinal**, a first integer with a value from zero up to a designated
    maximum ordinal value.
-   **Index**, a second  integer with a value from zero up to a designated
    maximum index value.

The specifier is generated by joining the above parts with a **Separator**
character.

The sequence colours of zoom boxes in the hierarchy can be determined as
follows.

-   The stub and separator are the same for all boxes in the hierarchy. They are
    constant values.

-   The ordinal value is determined as follows:

    -   The root box's ordinal value is zero.

    -   A child box's ordinal value can be determined as follows.

        1.  Determine the box's *ordinal parent* by ascending the zoom box
            hierarchy from child to parent until a box is reached whose colour
            specifier isn't a template colour.

            Note that the root box colour specifier isn't a template colour.
            This guarantees that there is always an ordinal parent.
        
        2.  Add one to the ordinal value of the ordinal parent.

        3.  If the result is less than or equal to the maximum ordinal value,
            then it is the child box's ordinal value. Otherwise, the child box's
            ordinal value is zero.

-   The index value is determined as follows:

    -   The root box index value is zero.

    -   The index value of the first child box in a parent is zero.

    -   The index value of a subsequent child box is the index of its preceding
        sibling plus one, unless that exceeds the maximum index value, in which
        case it is zero.

(There is a known issue in the above algorithm. It's possible that the last child
box in a parent gets the same sequence colour as the first child in the
parent's subsequent sibling. This results in two adjacent boxes having the same
sequence colour.)

# Palette Example
The following diagram and tables illustrate the above by reference to the zoom
box palette in the Dasher Version Six proof-of-concept code.

## Colour Specifiers Example

In the Dasher Version Six proof-of-concept, the stub is "sequence", the ordinal
and index maximum values are both one, and the separator is a hyphen, "-".

The following table lists all the colour specifiers, and their default display
colour mappings as hexadecimal red-green-blue values, and named web colours.

|Colour specifier | Default display colour mapping
|-----------------|-------------------------------------
|    sequence-0-0 | `#90ee90` LightGreen.
|    sequence-0-1 | `#98fb98` PaleGreen.
|    sequence-1-0 | `#add8e6` LightBlue.
|    sequence-1-1 | `#87ceeb` SkyBlue.
|         capital | `#ffff00` Yellow.
|         numeral | `#f08080` LightCoral (red).
|     contraction | `#fbb7f0` Pink but not a web colour.
|     punctuation | `#32cd32` LimeGreen.
|           space | `#d3d3d3` LightGray.

See also [https://en.wikipedia.org/wiki/Web_colors](https://en.wikipedia.org/wiki/Web_colors).





# Templates
Each node in the palette hierarchy there is a 



The relative sizes of boxes in the hierarchy is determined by other factors,
outside the palette. Those factors are discussed later in the specification.






Palette interface



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
