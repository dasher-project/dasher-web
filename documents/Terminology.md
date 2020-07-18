**Just notes at this time**

# Terminology

-   Dasher Version Six

    What we call this.

# Pointer and Solver Terminology


-   Sequential Dimension.

    The Cartesian X dimension, left-right, by default.

-   Lateral Dimension.

    Perpendicular to the sequential dimension.

    The Cartesian Y dimension, up-down, by default.

The rules of the solver are:

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
