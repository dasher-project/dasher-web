# Just notes

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

# Palette interface

In principle, a template can hold any property that:

-   Doesn't depend on the box's parent.
-   Doesn't depend on the box's position in the hierarchy.
-   Doesn't change after the zoom box has been created.


>   Mention the need for initialisation of the language model.




# Document Information
This document is part of the Dasher project and is under revision control here:  
[https://github.com/dasher-project/dasher-web](https://github.com/dasher-project/dasher-web)

(c) 2020 The ACE Centre-North, UK registered charity 1089313.  
MIT licensed, see [https://opensource.org/licenses/MIT](https://opensource.org/licenses/MIT)
