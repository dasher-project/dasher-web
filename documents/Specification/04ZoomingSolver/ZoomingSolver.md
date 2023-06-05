# Zooming Solver
This document is part of the Dasher Version Six Specification. It introduces the
concept of the zooming solver.

Some terms used here are defined in earlier parts of the specification. See also
the [previous section](../03ZoomingRules/ZoomingRules.md) of the specification,
and the [table of contents](../).

# Zooming Solver Definition
A logical outcome of the size map rule is that there can be a
**Zooming Solver** that provides the following functions.

-   **Solve Lateral Size**: given a front position value, return the
    corresponding mapped size.

-   **Solve Front Position** given a lateral size, return the front position to
    which the lateral size would correspond as the mapped size.

Adding the the minimum size rule means the following.

-   The solve lateral size function will return the minimum mapped size for any
    front position that is forward of the minimum size position.

-   The solve front position function will return the minimum size position for
    any lateral size that is equal to or less than the minimum mapped size.

Note that the solver doesn't provide any function related to lateral centre
position, nor to the back of a box.

# Zooming Solver Terms
Zooming solvers can be defined in the following terms.

-   An algorithm that conforms to the zooming rule set and provides the above
    solver functions, can be referred to as a **Solver Algorithm** or just a
    solver algorithm, or an algorithm, if this is obvious from context.

-   A solver algorithm can have parameters, referred to as **Solver Parameters**.

A single zooming UI implementation could include a number of different solver
algorithms. The user could be given an option to select between different solver
algorithms, and the option to set or select values for solver parameters.

# Zooming Solver Algorithm Examples
Here are some examples of zooming solver algorithms and parameters.

## Simple Linear Solver Algorithm
A simple linear solver algorithm can be defined as follows.

The algorithm has the following parameters.

-   Minimum size position, see above. The minimum size position can also be
    referred to as the **Solver Limit** in this context.

-   Minimum mapped size, see above.

-   **Reference Position**.  
    The parameter's value represents a possible front position such that the
    solver limit is forward of the reference position.

-   **Reference Size**.  
    The parameter's value represents a possible lateral size such that the
    references size is larger than the minimum mapped size.

Based on the parameters, the following intermediate values can be calculated.

-   **Reference position offset (RPO)**, is the difference between the reference
    position and the solver limit in the reverse direction.

-   **Reference size offse (RSO)**, is the reference size minus the minimum
    mapped size.

The solve lateral size function would execute as follows for a given front
position, *P*.

1.  If P is forward of the solver limit, return the minimum mapped size.

    Otherwise, continue with the following steps.

2.  Calculate the current position offset, *CPO*, as the difference between P
    and the solver limit, in the reverse direction.

3.  Calculate the solved size offset, *SSO*, as CPO divided by RPO then
    multiplied by RSO.

4.  Return SSO plus the minimum mapped size.

The solve front position function would execute as follows for a given lateral
size, *L*.

1.  Calculate the current size offset, *CSO*, as L minus the minimum mapped
    size.

2.  If CSO is negative, return the minimum size position.

    Otherwise, continue with the following steps.

3.  Calculate the solved position offset, *SPO*, as CSO divided by RSO then
    multiplied by RPO.

4.  Apply SPO as a change in the reverse direction to the minimum size position
    to calculate the return value.

The parameters and calculations are illustrated in the linear solver diagram,
below.

## Linear Solver Diagram
The following diagram illustrates the parameters and calculations made by a
simple linear solver algorithm.

<picture>
    <source
        media="(prefers-color-scheme: dark)"
        srcset="LinearSolver_exported-dark.svg" >
    <img src="LinearSolver.svg">
</picture>

Notes on the diagram:

-   The lateral and sequential dimensions, and the forward and reverse
    directions, reflect the Dasher Version Six user interface designations.

-   P.n labels show the order of calculations for the solve lateral size
    function.

-   L.n labels show the order of calculations for the solve front position
    function.

-   The terms CPO, SSO, CSO, and SPO, are defined in the Simple Linear Solver
    Algorithm description, above.

## Stepped Linear Solver Algorithm
A stepped linear solver algorithm can be defined as follows.

The algorithm has the following parameters.

-   Minimum size position, see above.

-   Minimum mapped size, see above.

-   **Reference Position List**.  
    The parameter's value represents a list of possible front position such
    that:

    -   No value occurs more than once in the list.

    -   The list is sorted by forward position, from least forward to furthest
        forward.

    -   The solver limit is forward of the last position in the list.

-   **Reference Size List**.  
    The parameter's value represents a list of possible lateral sizes such that:

    -   There are the same number of items in the list as in the reference
        position list.

    -   No value occurs more than once in the list.

    -   The list is sorted in order of decreasing magnitude.

    -   The last size in the list is larger than the minimum mapped size.
    
The solve lateral size function would execute as follows for a given front
position, *P*.

1.  If P is forward of the solver limit, return the minimum mapped size.

    Otherwise, continue with the following steps.

2.  If P is forward of last reference position, then apply the solve lateral
    size function in the simple linear solver algorithm to P, with the following
    parameters.

    -   Give the last reference position as the simple reference position.

    -   Give the last reference size as the simple reference size.

    Otherwise, continue with the following steps.

3.  If the first item in the reference position list is forward of P, then apply
    the solve lateral size function in the simple linear solver algorithm to P,
    with the following parameters.

    -   Give the first reference position as the simple reference position.

    -   Give the first reference size as the simple reference size.

    -   Give the second reference position as the minimum size position.

    -   Give the second reference size as the minimum mapped size.

    Otherwise, continue with the following steps.

4.  Find in the reference position list the first value, *PF* that is forward of
    P or equal to P. Take the index of PF in the list as *PFI*
    
    Note that there is guaranteed to be a reference position that meets this
    condition, otherwise a previous step would have already returned a solved
    size. Also, the reference position will be the second in the list, or later.

5.  Apply the solve lateral size function in the simple linear solver algorithm
    to P, with the following parameters.

    -   Give the value at index (PFI minus one) in the reference position list
        as the simple reference position.

    -   Give the value at index (PFI minus one) in the reference size list as
        the simple reference size.

    -   Give PF as the minimum size position.

    -   Give the value at index PFI in the reference size list as the minimum
        mapped size.

The solve front position function would execute as follows for a given lateral
size, *L*.

1.  If L is smaller than the minimum mapped size, return the minimum size
    position.

    Otherwise, continue with the following steps.

2.  If L is smaller than the last reference size, then apply the solve front
    position function in the simple linear solver algorithm to L, with the
    following parameters.

    -   Give the last reference position as the simple reference position.

    -   Give the last reference size as the simple reference size.

    Otherwise, continue with the following steps.

3.  If L is larger than the first item in the reference size list, then apply
    the solve front position function in the simple linear solver algorithm to
    L, with the following parameters.

    -   Give the first reference position as the simple reference position.

    -   Give the first reference size as the simple reference size.

    -   Give the second reference position as the minimum size position.

    -   Give the second reference size as the minimum mapped size.

    Otherwise, continue with the following steps.

4.  Find in the reference size list the first value, *SF* that is smaller than
    or equal to L. Take the index of SF in the list as *SFI*

    Note that there is guaranteed to be a reference size that meets this
    condition, otherwise a previous step would have already returned a solved
    position. Also, the reference size will be the second in the list, or later.

5.  Apply the solve front position function in the simple linear solver
    algorithm to L, with the following parameters.

    -   Give the value at index (SFI minus one) in the reference position list
        as the simple reference position.

    -   Give the value at index (SFI minus one) in the reference size list as
        the simple reference size.

    -   Give the value at index SFI in the reference position list as the
        minimum size position.

    -   Give SF as the minimum mapped size.

Dasher Version Six implements a stepped linear solver algorithm. There are two
choices of reference position list and reference size list.  

## Square Solver Algorithm
A square solver algorithm can be defined as follows.

The algorithm has the same parameters as the simple linear solver algorithm, see
above, but chosen so that reference position offset is equal to reference size
offset.

Some versions of Dasher other than Dasher Version Six appear to implement
something like a square solver algorithm.

# Next Section
The next section in the specification is the
[Zoom Box Palette](../05ZoomBoxPalette/ZoomBoxPalette.md).

See also the [table of contents](../).

# Document Information
This document is part of the Dasher project and is under revision control here:  
[https://github.com/dasher-project/dasher-web](https://github.com/dasher-project/dasher-web)

(c) 2020 The ACE Centre-North, UK registered charity 1089313.  
MIT licensed, see [https://opensource.org/licenses/MIT](https://opensource.org/licenses/MIT)
