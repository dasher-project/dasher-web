# Dasher Version Six Specification
Dasher Version Six is an implementation of the Dasher zooming text entry system.

This specification is retroactive in relation to the proof-of-concept code. It
is also forward-looking.

A substantial part of the specification are definitions of terms that should be
used when discussing Dasher Version Six, and in its project documentation. Some
terms are also illustrated in diagrams in the specification.

# Zooming User Interface
A zooming user interface is one that can be described in the following terms.

-   There is a two-dimensional space, the **Zooming Area**. Points in the
    zooming area can be represented by, for example, Cartesian X and Y
    co-ordinates.

    The relationship between the zooming area and other elements in a zooming
    user interface (UI), can be any combination of the following.

    -   Other elements of the zooming UI are adjacent to the zooming area.

    -   Other elements of the zooming UI are superimposed in front of the
        zooming area.

    For example, in Dasher Version Six proof-of-concept:
    
    -   In the browser UI, the control panel and message bar are adjacent to and
        above the zooming area, and the copyright and license statement is
        adjacent to and below the zooming area.

    -   In the custom keyboard UI, the prediction selector and message bar are
        adjacent to and above the zooming area, and the next-keyboard button is
        superimposed in front of the zooming area.

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

## Zooming User Interface Diagram
The following diagram illustrates the relationship between the zooming area and other user interface elements in the Dasher Version Six browser proof-of-concept.

<picture>
    <source
        media="(prefers-color-scheme: dark)"
        srcset="UserInterfaceTerminology_exported-dark.svg" >
    <img src="UserInterfaceTerminology.svg">
</picture>

Notes on the diagram:

-   The pointer isn't shown.

-   ZoomBox outlines have been switched on for clarity of illustration. Outlines
    aren't shown by default.

# Next Section
The next section in the specification is the
[Basic Definitions](../02BasicDefinitions/BasicDefinitions.md).

See also the [table of contents](../).

# Document Information
This document is part of the Dasher project and is under revision control here:  
[https://github.com/dasher-project/dasher-web](https://github.com/dasher-project/dasher-web)

(c) 2020 The ACE Centre-North, UK registered charity 1089313.  
MIT licensed, see [https://opensource.org/licenses/MIT](https://opensource.org/licenses/MIT)
