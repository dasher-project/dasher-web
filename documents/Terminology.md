# Just notes


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

-   Solver Zero.

    The boundary beyond which the solver would give a box zero height.



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
This diagram is part of the Dasher project and is under revision control here:  
[https://github.com/dasher-project/redash/tree/master/documents](https://github.com/dasher-project/redash/tree/master/documents)

(c) 2020 The ACE Centre-North, UK registered charity 1089313.  
MIT licensed, see [https://opensource.org/licenses/MIT](https://opensource.org/licenses/MIT)
