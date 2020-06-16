#!/usr/bin/perl

# Return a subset of the test set based on columns in the data file.
#
# Copyright 2011 by Keith Vertanen
#

use strict;

if ( @ARGV < 3 )
{
    print "$0 <metadata filename> <col1> <range1> [col2] [range2] ...\n"; 
    print "\n";
    print "Range can be a single value or a range separated by a dash: 10, 10-20\n";
    exit(1);
}

my $metaFile;
my $line;
my @col;
my @low;
my @high;
my $i;
my @chunks;
my $good;
my $val;
my $index;

($metaFile) = $ARGV[0];

open(IN, $metaFile);
$line = <IN>;
$line =~ s/[\n\r]//g;
@chunks = split(/\t/, $line);

for ($i = 1; $i < @ARGV; $i += 2)
{
    my $j = 0;
    my $found = 0;

    while ((!$found) && ($j < @chunks))
    {
	    if ($chunks[$j] eq $ARGV[$i])
	    {
	        push @col, $j;
    	    $found = 1;
	    }
	    $j++;
    }
    if (!$found)
    {
    	print "ERROR: column " . $ARGV[$i] . " not defined!\n";
    	exit(1);
    }

    if ($ARGV[$i + 1] =~ /\-/)
    {
        # We have a range
        my @range = split(/\-/, $ARGV[$i + 1]);
        if (@range == 2)
        {
            push @low, $range[0];
            push @high, $range[1];           
        }
        else
        {
        	print "ERROR: column " . $ARGV[$i] . ", bad range " . $ARGV[$i + 1] . "\n";
        	exit(1);            
        }
    }
    else
    {    
        # Same value for low and high
        push @low, $ARGV[$i + 1];
        push @high, $ARGV[$i + 1];
    }
}

# Read in the next file containing a message
while ($line = <IN>)
{
    $line =~ s/[\n\r]//g;
    @chunks = split(/\t/, $line);

    # See if this line meets all the conditions
    $good = 1;
    $i = 0;
    while (($good) && ($i < @col))
    {
	    $index = $col[$i];
	    $val   = $chunks[$index];

	    # Check for a text value, in which case we just check equality with low or high
	    if (($low[$i] =~ /[a-zA-Z]/) && ($val ne $low[$i]) && ($val ne $high[$i]))
	    {
    	    $good = 0;
	    }	    
	    # Normal numeric range
	    elsif (($val < $low[$i]) || ($val > $high[$i]))
	    {
    	    $good = 0;
    	}
    
	    $i++;
    }

    if ($good)
    {
	    print $chunks[0] . "\t";

	    # Drop leading/trailing " that may get introduced by Excel
	    $chunks[1] =~ s/^\"//;
	    $chunks[1] =~ s/\"$//;

	    print $chunks[1] . "\n";
    }
    
#    print $line . "\n";
}
