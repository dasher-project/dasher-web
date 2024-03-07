# Zoom Box Movement
This document is part of the Dasher Version Six Specification. It describes how
zoom boxes move in response to the user.

Some terms used here are defined in earlier parts of the specification. See the
[table of contents](../).

# Zoom Box Movement Terms
The movement of zoom boxes is based on continual discrete movements, each
referred to here as a *Zooming Move* or just a move.

A *Zooming Vector Move* is one that is specified in these terms.

-   *Target* zoom box to which the move applies.
-   *Vector* with sequential and lateral dimensions.

A *Zooming Destination Move* is one that is specified in these terms.

-   Target zoom box, same as a vector move.
-   Either a destination Front Position or a destination Lateral Size.
-   Destination Lateral Centre.

Any interface that generates zooming moves can be referred to as a
*Zooming Controller*. The Dasher Version Six proof-of-concept implements a 
zooming controller that generates vector moves by tracking the position of a
pointer on the screen. The user can control the pointer by these mechanisms.

-   Using a mouse, trackball, trackpad, or other pointer device.
-   Touching the screen, on a smartphone, tablet or other device that has a
    touch screen.

Controllers are discussed in detail elsewhere in the specification TBD. That
discussion includes

-   how vector or destination values are generated.
-   how a target zoom box is selected.

Zooming moves are processed the same regardless of the type of controller that
generated the move.

# Zoom Box Move Processing
Processing steps for a single zooming move are as follows.

1.  If the controller has generated a vector move, transform it into a
    destination move. See under **Generate Destination Move from Vector Move**,
    below.

    If the controller has generated a destination move, skip this step.

2.  Finalise the target's destination position and size, *TPS*. Finalisation
    processing depends on what was specified in the move.

    If the move specified a front position then generate a lateral size by
    invoking the solve lateral size function. Vice versa, if the move specified
    a lateral size then generate a front position by invoking the solve front
    position function.

    Solving functions are described in
    the [Zooming Solver](../04ZoomingSolver/ZoomingSolver.md) section.

3.  Generate an initial updated root box position and size, *IPS*. IPS is
    defined by being consistent with the target having TPS. See under
    **Generate Root Destination from Target Destination**, below.

    Put another way, generate IPS such that the cascade TBD would result in the
    target zoom box being at TPS.

    Note that generation of a root destination move can include replacement of
    the root zoom box.

4.  Prevent disappearance of the root zoom box. See under
    **Zoom Box Movement Root Disappearance Prevention**, below.

    The outcome of that processing is a final root box position and size, *FPS*,
    that ensures the root box doesn't disappear. Note that FPS could be the same
    as IPS or could be different.

5.  Update the root box to FPS and cascade the update down the zooming
    hierarchy. See under **Zoom Box Move Cascade TBD**, below.

That concludes the processing for one zoom box move.

# Generate Destination Move from Vector Move
Generating a zooming destination move from a zooming vector move is a possible
Zoom Box Move Processing step, see above.

This example move vector and target are used to illustrate the processing.

Object      | Attribute            | Original Value
------------|----------------------|---------------
Target      | Front position       | 100
Target      | Lateral centre       | 200
Target      | Lateral size         | 150
Move vector | Sequential component | -30
Move vector | Lateral component    | -20

Add the vector's sequential and lateral components to the target's front
position and lateral centre to generate destination values.

Object | Attribute      |Original|Destination
-------|----------------|--------|-----------
Target | Front position | 100    | 70
Target | Lateral centre | 200    | 180

Take those values and the target zoom box as a zooming destination move. In this
case a destination front position has been specified.

# Generate Root Destination from Target Destination
Generating a root destination from a target destination is a Zoom Box Move
Processing step, see above.

A target destination will have been finalised already in these terms.

-   Target zoom box.
-   Destination lateral size and front position.
-   Destination lateral centre.

Processing here is illustrated with a continuation of the example values from
the previous description in the Generate Destination Move from Vector Move
processing, above. Also shown here is an assumed value for the destination
lateral size as mapped from the destination front position by the solver, see
Zoom Box Move Processing step 2, above.

Object | Attribute      |Original|Destination
-------|----------------|--------|-----------
Target | Lateral centre |        | 180
Target | Front position |        | 70
Target | Lateral size   | 150    | 180

(The zooming solver isn't discussed here but moving in the reverse sequential
direction will increase lateral size.)

Processing steps to generate a root destination from a target destination are as
follows.

1.  If the target is the root of the zoom box hierarchy then check if the root
    ascent conditions are met.

    Root ascent is described elsewhere in the specification TBD but it could be
    [Zoom Box Spawning](../06ZoomBoxSpawning/ZoomBoxSpawning.md). For
    convenience, the conditions are these.
    
    -   The zooming area limits aren't entirely within the root box's formal
        representation.
    -   Either there is at least one stored box from a previous root descent, or
        a new parent box can be synthesised from the target.

    (There won't be a stored box if the target is the original root with empty
    box text. Parent synthesis is described elsewhere in the specification TBD
    but also won't be possible if the target box text is empty.)

    These are some outcomes of root ascent, if it takes place.

    -   The previously stored parent of the target, or a synthesised new parent,
        will be added to the zooming hierarchy as the root.
    -   The target box will be a child of the new root.
    -   Siblings of the target box will have been weight spawned. Weight
        spawning is described elsewhere in the specification TBD but it could be
        [Zoom Box Spawning](../06ZoomBoxSpawning/ZoomBoxSpawning.md).

    Whether the root ascent conditions were met or not, processing continues to
    the next step.

2.  If the target is the root of the zoom box hierarchy, skip the remaining
    steps. The root destination is the target destination.

    Note that if the target was the root at the start of root destination
    generation then it could only be the root now if the root ascent conditions
    weren't met in the previous step.

    If the target isn't the root then continue to the next step. The parent box
    of the target is referred to as the *parent* in the next steps.

3.  Calculate the parent's destination lateral size based on the target's child
    weight and destination lateral size.
    
    Object | Attribute    |Original|Destination
    -------|--------------|--------|-----------
    Target | Child weight | 0.1    |
    Target | Lateral size |        | 180
    Parent | Lateral size | 1500   | 1800

    The parent lateral size is an example for the purposes of illustration. For
    ease of reading, child weight has been normalised here. In detail, the
    target child weight could be one, for example, which means the sum of all
    its siblings' child weights would be ten. The parent's original lateral size
    is included for completeness and isn't a factor in the calculation.

5.  Calculate the parent's destination lateral centre.

    1.  Sum the weights of the target's siblings that are before it in the
        parent to generate a result *W1*. Note that W1 would be zero if the
        target is the first child.
    2.  Sum the weights of the target and all its siblings to generate a result
        *W2*.
    3.  Calculate a destination lateral offset, *DLO*, by multiplying the
        parent's destination lateral size, *DLS*, by W1, then dividing the
        result by W2.
        
        As a formula `DLO = (DLS × W1) ÷ W2`.

    4.  Calculate the destination lateral edge, *DLE*, as the sum of these
        factors.
    
        -   The target's lateral centre, *TLC*.
        -   The target's lateral size, *TLS*, divided by two.
        -   DLO.

        As a formula `DLE = TLC + (TLS ÷ 2) + DLO`
    
    5. Deduct half the DLS from DLE.

    The result is the parent's destination lateral centre.
    
    Object or objects          | Attribute            |Original|Destination
    ---------------------------|----------------------|--------|-----------
    Target                     | Lateral centre       |        | 180
    Target                     | Lateral size         |        | 180
    Parent                     | Lateral size         |        | 1800
    Siblings before the target | Sum of child weights |    0.2 |
    Parent                     | Lateral centre       |   -175 | -270

    The sum of child weights is an example for the purposes of illustration. For
    ease of reading, child weight has been normalised here. In the terms used in
    the calculation, above, W2 is one.

    The parent destination lateral centre calculation in full is as follows.  
    `180 + (180 ÷ 2) + (1800 × 0.2) - (1800 ÷ 2) = -270`

    (Note that child weights don't change after spawning. That means the sum of
    the weights of the siblings before each child need only be calculated once,
    at weight spawning time. That and use of normalised weights are possible
    optimisations for implementation.)

6.  Calculate the parent's destination front position by invoking the solve
    front position function passing in its destination lateral size.

    Destination front position will be needed for the root descent determination
    step in the next iteration.

    This processing step is similar to **Zoom Box Move Processing** step 2,
    above. The destination lateral size of a moving zoom box is given by a value
    returned by a solver function.

    Object      | Attribute      |Original|Destination
    ------------|----------------|--------|-----------
    Parent      | Lateral size   |        | 1800
    Parent      | Front position | -1250  | -1550

    As before, the mapped size has been assumed for the purposes of
    illustration. The value is consistent with a square solver type of
    algorithm; the change in front position is the same as the change in the
    lateral size.

7.  Taking the parent destination as the target destination repeat the
    processing steps above.

    In effect, processing ascends the hierarchy until the root is reached and
    its destination has been calculated.

That concludes the description of generating a root destination from a target
destination. Note that the actual processing finishes in step 2, after a number
of iterations.

# Zoom Box Movement Root Disappearance Prevention
Prevention of disappearance of the root box is a Zoom Box Move Processing step,
see above.

Disappearance of the root box is prevented by restricting its size and position.
These restrictions are applied.
    
-   The root box has a minimum lateral size, *MLS*.
-   One or more of these conditions must be true, based on the root box's formal
    representation.
    -   The root box is entirely within the zooming area, laterally.
    -   The zooming area is entirely within the root box, laterally
    -   A minimum margin amount, *MMA*, of the root box is laterally within the
        zooming area.

Minimum values could be expressed as absolute values, or as formulas based on
the size of the zooming area, or both. MMA could be the same as MLS.

These terms are used with these meanings here.

-   There are two zooming area limits in the lateral dimension, the 
    *positive lateral limit* and the *negative lateral limit*. The positive
    lateral limit has a higher value in the lateral dimension than the negative
    lateral limit.
    
    In the Dasher Version Six proof-of-concept (PoC), for example, the positive
    lateral limit is the top of the zooming area and the negative lateral limit
    is the bottom. In the PoC the origin's vertical position is always the
    centre of the zooming area. So if the positive lateral limit is Y then the
    negative lateral limit is minus Y.

-   There are two zooming area margins in the lateral dimension. Each margin has
    a value in the lateral dimension only.

    The value of one margin, the *positive lateral margin*, is calculated by
    deducting MMA from the positive lateral limit.

    The value of the other margin, the *negative lateral margin*, is calculated
    by adding MMA to the negative lateral limit.

-   Each zoom box has two sides in the lateral dimension. Each side has a
    value in the lateral dimension only.
    
    The value of one side, the *positive lateral side*, is calculated by adding
    half the box's lateral size to its lateral centre.

    The value of the other side, the *negative lateral side*, is calculated by
    deducting the box's lateral size from the positive lateral side.

All those defined values are signed numbers.

>   Jim, add a diagram here.

The distances of the limits and sides from the zooming area origin isn't
relevant to the processing here.

Root disappearance prevention takes place after the root destination has been calculated. The root destination will have these values.

-   Front position and lateral size.
-   Lateral centre.

Processing is as follows.

1.  Check if the root destination lateral size is below MLS. If it is then
    override the size to MLS instead.
    
2.  If the root destination's lateral size was overridden in the previous step
    then override its front position too. Generate the override value by
    invoking the solve front position function passing in the new lateral size.

    The zooming solver is described elsewhere in the specification, see
    [Zooming Solver](../04ZoomingSolver/ZoomingSolver.md).

3.  If the positive lateral side of the root destination has a lower value than
    the positive lateral limit, and the negative lateral side has a higher value
    than the negative lateral limit, then root disappearance prevention
    processing is complete and the remaining steps are skipped.

4.  If the positive lateral side of the root destination has a higher value than
    the positive lateral limit, and the negative lateral side has a lower value
    than the negative lateral limit, then root disappearance prevention
    processing is complete and the remaining steps are skipped.

5.  Calculate the root destination's positive marginal visibility, *PMV*, by
    deducting its positive lateral side value from the negative lateral margin
    value. If PMV is more than zero then the MMA restriction has been broken.

    Adjust the root destination's position by adding PMV to its lateral centre.
    That adjustment will enforce the MMA restriction and the remaining steps are
    skipped.

    Otherwise, if PMV is less than or equal to zero, continue to the next step.

6.  Calculate the root destination's negative marginal visibility, *NMV*, by
    deducting its negative lateral side value from the positive lateral margin
    value. If NMV is less than zero then the MMA restriction has been broken.

    Adjust the root destination's position by adding NMV to its lateral centre.
    That adjustment will enforce the MMA restriction and the remaining steps are
    skipped.

    Otherwise, if NMV is greater than or equal to zero, the MMA restriction
    hasn't been broken.

That concludes prevention of disappearance of the root box.







3.  Taking the target as a reference, cascade updates to its parents. Processing
    is described under **Zoom Box Movement Upward Cascade**, below.

    Note that there are no updates to the target during the upward cascade.

    The upward cascade finishes after the size and position of every parent up
    to the root box has been updated.

4.  Enforce the root disappearance restrictions. The restrictions prevent the
    root box from disappearing out of the zooming area user interface, in either
    dimension. Processing is described under
    **Zoom Box Movement Root Disappearance Prevention**, below.

    These are the possible outcomes of disappearance prevention.

    -   The root box size and position update resulting from the upward cascade
        applies *unchanged*.
    -   The root box size and position update resulting from the upward cascade
        applies with modification, referred to here as an *override*.
    -   The root box size and position update is *blocked*. That could happen if,
        for example, the root box was on the edge of the zooming area.

    Note that the override, if there is one, is a replacement size and position.
    It isn't a replacement vector.

    In the blocked case, no further processing takes place. Otherwise processing
    continues to the next step.

5.  Check for necessary adjustments to any child boxes that weren't updated in
    the upward cascade. Processing is described under
    **Zoom Box Movement Downward Cascade**, below.






    The conditions for downward cascades are as follows.

    -   Downward cascade applies to the child boxes of the target box.
    -   If a zoom box was part of the upward cascade, but its child boxes
        weren't, then downward cascade applies to the child boxes.

    The downward cascades can result in boxes being added and removed from the
    hierarchy.

    The downward cascades won't change the sizes and positions of the target nor
    any boxes that were updated during the upward cascade. However, other
    changes could be applied to those boxes, such as child deletion and root
    replacement.

That concludes move processing.

# Zoom Box Movement Cascade Diagram
This diagram illustrates which boxes in the hierarchy are updated at what stage
of Zoom Box move processing.

<picture>
    <source
        media="(prefers-color-scheme: dark)"
        srcset="MovementCascade_exported-dark.svg" >
    <img src="MovementCascade.svg">
</picture>

Key

-   T is the target of the move and is updated before the upward cascade.
-   U indicates boxes updated during the upward cascade.
-   D indicates boxes updated during the downward cascade.

# Zoom Box Movement Upward Cascade
An upward cascade is a step in zoom box movement processing, see above.
Processing here is illustrated with a continuation of the example values from
the previous description.

An upward cascade is processed in relation to a reference box, referred to in
this description as the target. The target's size and position will have been
updated prior to cascade processing.

1.  Check if the target meets the root descent conditions.

    Root descent is described elsewhere in the specification TBD but it could be
    [Zoom Box Spawning](../06ZoomBoxSpawning/ZoomBoxSpawning.md). For
    convenience, the conditions are that the zooming area limits are entirely
    within the target. These are some outcomes of root descent.
    
    -   The current root box, and any intermediate parent boxes between it and
        the target, are removed from the hierarchy.
        
        The removed boxes needn't be deleted as such. They may be added back to
        the hierarchy later, if root ascent takes place. This description
        assumes that the removed boxes are stored but outside the hierarchy.
        
        The child boxes of any removed root and parent boxes, other than the new
        root box, may be deleted or stored.

    -   The target box becomes the root of the hierarchy.

    If the root descent conditions were met then the upward cascade is finished
    and remaining steps are skipped. Otherwise continue to the next step.


    >   That could be optimised by pre-calculating for each box not only its own
    >   weight buy also total weights of siblings before it and siblings after
    >   it. Weights don't change after spawning.







5.  Update the target's siblings' lateral sizes based on their child weights and
    the parent's updated lateral size.

    Object      | Attribute    |Original|Updated
    ------------|--------------|--------|-------
    Parent      | Lateral size |        | 1800
    Sibling 1   | Child weight | 0.2    |
    Sibling 1   | Lateral size | 300    | 360
    Sibling 2   | Child weight | 0.08   |
    Sibling 2   | Lateral size | 120    | 144
    Sibling ... |              |        |

    The sibling values are examples for the purposes of illustration. Only two
    siblings have been shown. In a typical zoom box there would be up to 25 in a
    hierarchical palette, or around 70 in a flat palette.




6.  Update the target's siblings' lateral centres so that they fill the parent's
    updated lateral size with no gaps and no overlapping, as they would have
    been before move processing started. The calculations can be like this.

    1.  Calculate the sum of the adjusted lateral sizes of all the target's
        siblings that are before it in the parent to generate a result R1. Note
        that R1 could be zero, if the target is the first child.
    2.  Calculate R1 plus half the updated lateral size of the target to
        generate a result R2.
    3.  Calculate R2 plus the updated lateral centre of the target to generate a
        new parent lateral edge (PLE).
    4.  Calculate PLE minus half the updated lateral size of the parent's first
        child to generate a result R3.
    5.  Update the first child's lateral centre to R3.
    6.  Decrement PLE by the updated lateral size of the first child.
    7.  Repeat the calculation from step 4 but with the second child, then the
        third child, and so on until all the target's siblings have had their
        lateral centres updated.

    Note that the target's lateral centre won't change in the above
    calculations.

    Object      | Attribute      |Original|Updated
    ------------|----------------|--------|-------
    Sibling 1   | Lateral size   |        | 360
    Sibling 1   | Lateral centre | 425    | 450
    Target      | Lateral size   |        | 180
    Target      | Lateral centre |        | 180
    Sibling 2   | Lateral size   |        | 144
    Sibling 2   | Lateral centre | 65     | 18
    Sibling ... |                |        |

    In this example, Sibling 1 is the first child of the target's parent, the
    target is the second, and Sibling 2 is the third. Further siblings aren't
    shown.

7.  Update the siblings' front positions by invoking the solve front position
    function passing in each of their updated lateral sizes.

    Object      | Attribute      |Original|Updated
    ------------|----------------|--------|-------
    Sibling 1   | Lateral size   |        | 360
    Sibling 1   | Front position | -50    | -110
    Sibling 2   | Lateral size   |        | 144
    Sibling 2   | Front position | 130    | 106
    Sibling ... |                |        |

    As before, the mapped sizes have been assumed for the purposes of
    illustration. These values are consistent with a square solver type of
    algorithm.

8.  Update the target's parent's lateral centre based on its updated lateral
    size and its first child's updated lateral centre and size. The calculations
    can be like this.

    1.  Calculate the first child's updated lateral centre plus half the first
        child's updated lateral size to generate the Parent Lateral Edge (PLE).
    2.  Calculate PLE minus half the parent's updated lateral size to generate
        the parent's updated lateral centre.

    Object      | Attribute      |Original|Updated
    ------------|----------------|--------|-------
    Sibling 1   | Lateral size   |        | 360
    Sibling 1   | Lateral centre |        | 450
    Parent      | Lateral size   |        | 1800
    Parent      | Lateral centre | -175   | -270

    The calculation is like this.

        PLE = Sibling 1 lateral centre + ( Sibling 1 lateral size / 2 )
            = 630
        Parent lateral centre = PLE - ( Parent lateral size / 2 )
                              = 630 - 900




# Zoom Box Movement Processing Diagrams
These diagrams illustrate the examples in the processing steps, above.

Zoom boxes are shown as three-sided rectangles.

Updates in each step are shown by

-   solid lines for zoom boxes as they are at the start of the step.
-   dashed lines for the end of the step.

Dotted lines

-   with arrows and numbers indicate size and position values.
-   without arrows indicate lateral centres of zoom boxes for the purposes of
    showing lateral size in two halves or for showing lateral position.

In steps where a lateral size is changed, the updated box is shown with the same
lateral centre. There will be a later step in which lateral position also
changes.

Each diagrams is drawn to a scale that best shows the update in the
corresponding processing step. This means that the diagrams are at different
scales.

The first diagram illustrates the starting positions and some sizes.

<picture>
    <source
        media="(prefers-color-scheme: dark)"
        srcset="MoveProcessing00_exported-dark.svg" >
    <img src="MoveProcessing00.svg">
</picture>

<picture>
    <source
        media="(prefers-color-scheme: dark)"
        srcset="MoveProcessing01_exported-dark.svg" >
    <img src="MoveProcessing01.svg">
</picture>

<picture>
    <source
        media="(prefers-color-scheme: dark)"
        srcset="MoveProcessing02_exported-dark.svg" >
    <img src="MoveProcessing02.svg">
</picture>

<picture>
    <source
        media="(prefers-color-scheme: dark)"
        srcset="MoveProcessing03_exported-dark.svg" >
    <img src="MoveProcessing03.svg">
</picture>

<picture>
    <source
        media="(prefers-color-scheme: dark)"
        srcset="MoveProcessing04_exported-dark.svg" >
    <img src="MoveProcessing04.svg">
</picture>

<picture>
    <source
        media="(prefers-color-scheme: dark)"
        srcset="MoveProcessing05_exported-dark.svg" >
    <img src="MoveProcessing05.svg">
</picture>

<picture>
    <source
        media="(prefers-color-scheme: dark)"
        srcset="MoveProcessing06_exported-dark.svg" >
    <img src="MoveProcessing06.svg">
</picture>

<picture>
    <source
        media="(prefers-color-scheme: dark)"
        srcset="MoveProcessing07_exported-dark.svg" >
    <img src="MoveProcessing07.svg">
</picture>

<picture>
    <source
        media="(prefers-color-scheme: dark)"
        srcset="MoveProcessing08_exported-dark.svg" >
    <img src="MoveProcessing08.svg">
</picture>







# Zoom Box Movement Downward Cascade
Downward cascades are a step in zoom box movement processing, see above.

Each downward cascade starts at a particular zoom box that has just been
updated, referred to here as the *Cascade Parent*.

An initial set of cascade parents is generated as part of zoom box movement
processing, see above. For example, the target box of a zooming move will be a
cascade parent.

The processing for one downward cascade can result in further downward cascades,
to the child boxes of the cascade parent. In those cascades the child boxes will
be the cascade parents. This is described in the processing steps below.


1.  Check whether the cascade parent now meets the child deletion conditions.

    Child deletion is described elsewhere in the specification TBD but it could
    be [Zoom Box Spawning](../06ZoomBoxSpawning/ZoomBoxSpawning.md). For
    convenience, the conditions are that the cascade parent is entirely outside
    the zooming area limits.

    If the conditions are met then process child deletion now and skip the
    remaining steps for this downward cascade.

2.  Check whether the cascade parent meets the child spawning conditions.

    Child spawning is described elsewhere in the specification TBD but it could
    be [Zoom Box Spawning](../06ZoomBoxSpawning/ZoomBoxSpawning.md). For
    convenience, the conditions are that

    -   the box has no child boxes.
    -   all or part of the box is inside the zooming area limits.
    -   the box's lateral size can be calculated and is above a configured
        child spawning threshold.

    If the conditions are met, process child spawning now and skip the remaining
    steps for this downward cascade.

3.  Update the lateral size and front position of each child box. If the cascade
    parent has no child boxes then skip this step.

    The size of each child box will be determined by weighting and by the size
    of the cascade parent.
    
    >   Optimise by calculating total weight at child spawning time and
    >   normalising.
    
    
    >   The front position of each child box will be determined by the solver.



    >   Set the lateral size of the child box to its child weight multiplied by
    >   the parent lateral size. Solve the front position of the child box by
    >   passing the updated lateral size to the function.

    >   Set the lateral centre of the first child to the lateral centre of the
    >   parent plus half the parent lateral size. Or set it to the lateral
    >   centre of the preceding child minus half the lateral size of the
    >   preceding child.


    >   Oh dear. Might have to have the root descent check here in addition to
    >   in the upward cascade. Upward cascade could instead be characterised as
    >   transferring the move to the root. The root ascent check would still be
    >   made there.
    
    >   Some of these checks would apply to resizing the zooming area.
    >   Specifically, root ascent and descent, child box deletion, child
    >   spawning.



4.  Repeat a downward cascade for each child box. In these cascades the child
    box will be the cascade parent.

That completes processing of a downward cascade.

# Next Section
The next section in the specification is TBD.

See also the [table of contents](../).

# Document Information
This document is part of the Dasher project and is under revision control here:  
[https://github.com/dasher-project/dasher-web](https://github.com/dasher-project/dasher-web)

(c) 2023 The ACE Centre-North, UK registered charity 1089313.  
MIT licensed, see [https://opensource.org/licenses/MIT](https://opensource.org/licenses/MIT)
