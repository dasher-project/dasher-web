
The Enron Mobile Email Dataset
==================================================
http://www.keithv.com/software/enronmobile

A data set consisting of emails composed by Enron employees on BlackBerry 
mobile devices.  Each sentence is categorized as being personal, business or
Enron specific.  Each sentence has data about how easy it was to memorize 
and how fast and accurately it could be typed on a full-sized keyboard.

The sentence and sentence fragments were found by looking for messages with the
default BlackBerry signature at the end of an email.  All the sentences were 
manually reviewed and corrected by two humans.

For further details see our paper "A Versatile Dataset for Text Entry 
Evaluations Based on Genuine Mobile Emails" in MobileHCI 2011:
http://www.keithv.com/pub/enronmobile/enronmobile.pdf

Easy to remember sentence sets
==================================================
For most text entry evaluations, we recommended you use the following sets:

mem1.txt - 40 easy to remember sentences, set 1
mem2.txt - 40 easy to remember sentences, set 2
mem3.txt - 40 easy to remember sentences, set 3
mem4.txt - 40 easy to remember sentences, set 4
mem5.txt - 40 easy to remember sentences, set 5

Each sentence in the above sets has 3 or more words.  Each sentence was 
remembered correctly by 8 or more workers out of 10.  Each sentence was also 
copied correctly by 8 or more workers out of 10 (see paper for details).  We
manually reviewed these sentences, removing anything with questionable grammar.  

Sentence sets are tab delimited files where the first column is a unique
ID for a sentence and the second column is the actual text.

Character combination sets
==================================================
For text entry evaluations where a test subset having character pair frequencies 
similar to the entire dataset is desired:

bi40.txt  - 40 sentences with representative character bigram frequencies
bi80.txt  - 80 sentences with representative character bigram frequencies
bi160.txt - 160 sentences with representative character bigram frequencies
bi320.txt - 320 sentences with representative character bigram frequencies

We used a modified version of the procedure described in Paek, T. and Hsu, B. 
"Sampling representative phrase sets for text entry experiments: a procedure 
and public resource."  We kept entire sentences intact.  We used only sentences 
with 3-9 words.  A sentence was allowed to appear only once in a set.  From the 
full 2239  sentences, we sampled 1 million sentence subsets .  We chose the 
subset with the minimum KL-divergence between the set's character bigram 
distribution and the distribution calculated over all 2239 sentences.

Memorable character combination set
==================================================
For evaluations in which memorable text and representative character pairs is
desired:

mem_bi.txt - 40 sentence memorable sentences with representative bigram frequencies

Filtered subsets
==================================================
We progressively filtered the entire set of sentences to provide subsets 
appropriate to different interface capabilities and modalities.

filename                 sentences  description
--------                 ---------  -----------
mobile_orig.txt          2239       Full set, corrected mixed case with symbols
                                    as typed by the user.

mobile_orig_simple.txt   2109       Limited punctuation to ?!,.'

mobile_orig_nospell.txt  1877       Removed possible acronyms (e.g. PDF, LCs)

mobile_orig_body.txt     1446       4 or more words, must end in ?!.

mobile_orig_nonum.txt    1347       No number characters

Each file is tab delimited, the first column is a unique ID for each sentence, 
the second column is the text.  See the step-by-step process for details of how
we constructed each set.

There are also versions of all the above intended for speech recognition 
experiments.  These are stored in mobile_vp_*.txt and mobile_nvp_*.txt:
  vp  - lower case with symbols/numbers replaced with verbalized form 
        (i.e. punctuation characters have been replaced with ,comma 
        ?question-mark etc).
  nvp - lower case, stripped of all verbalized punctuation but still
        contains verbalized numbers (e.g. "i heard it was at five").
        
Test set metadata
==========================================
We have supplemented each test set sentences with metadata about that sentence.
This data was obtained by analyzing the text as well as by running several user
experiments on Amazon Mechanical Turk.  

metadata_orig.txt - tab-delimited file containing meta data for all the 
                    sentences in mobile_orig.txt

Basic columns in the metadata file are as follows:

  id               - unique ID for this sentence
  text             - text of the sentence
  words            - number of words in sentence
  chars            - number of characters in sentence
  oov              - number of OOV words with respect to WSJ0 64K lexicon
                     (wlist_wsj64k.txt)
  oov_percent      - percent of words that are OOV
  first            - 1 if sentence contains a first person personal pronoun
  question         - 1 if the sentence ends in ?
  category         - p = personal, b = business, e = Enron-specific

Columns associated with our Turk memorization experiment.  Workers were shown
a sentence and then asked to type it from memory (without being able to see
it).  "X" in the following ranges from 0-9 since 10 different workers did the 
experiment for every sentence in the test set.  

  mem_worker_X         - anonymized unique Amazon Turk worker ID
  mem_country_X        - country of worker (self-reported)
  mem_english_X        - English ability of worker (self-reported)
  mem_read_time_X      - time in milliseconds reading the sentence and trying
                         to memorize it
  mem_typing_time_X    - time in milliseconds from first typed character to
                         the last typed character
  mem_response_text_X  - the text typed by the worker
  mem_cer_X            - character error rate (CER)
  mem_cer_lower_X      - CER ignoring case
  mem_cer_nopunc_X     - CER ignoring case and punctuation
  mem_wpm_X            - entry rate in words per minute (word = 5 characters including spaces)

For convenience, we provide columns with summary statistics across the 10 workers:

  mem_read_time        - average read time in milliseconds
  mem_cer              - average CER
  mem_count_cer0       - count of workers who had a CER of 0
  mem_cer_lower        - average CER ignoring case
  mem_cer_nopunc       - average CER ignoring case and punctuation
  mem_wpm              - average entry rate
    
The columns associated with our Turk typing speed experiment are the same as
the above except they are prefixed with "type_".  There is no read_time for 
this experiment.

We have included a Perl script that can return sentence subsets based on
one or more inclusive numeric ranges specified for the columns.  The category 
column can be searched by matching the specified code (p = personal, 
b = business, e = Enron).  Examples:

Sentences that had an average typing speed of 70-80 wpm:
  perl TestSubset.pl metadata.txt type_wpm 70.0-80.0

Sentences that every worker remembered exactly correctly:
  perl TestSubset.pl metadata.txt mem_cer 0.0

Sentences entered at >= 40.0 wpm and with <= 5.0 CER:
  perl TestSubset.pl metadata.txt mem_cer 0.0-5.0 type_wpm 40.0-9999.0

Business messages with 10 or more words that were questions:
  perl TestSubset.pl metadata.txt category b question 1 words 10-99  

Step-by-step build process (in build subdirectory)
==================================================
Here are the basic steps that we followed to create the data set (on a Linux 
machine with Perl installed).  Some steps involve manual human effort.

1)  Set environment variable ENRON_DIR to location of the Enron corpus' mail 
    directory (maildir).

2)  find_files.sh - Create list of message files with and without the 
    BlackBerry signature text.

3)  parse_text.sh - Get the raw text and meta information for every message 
    that had a BlackBerry signature.

4)  prep_human.sh - Prepare files for use in human editing to correct spelling 
    errors, etc.

5)  One person did manual correction of human0 and another did human1, 
    producing human0.txt and human1.txt respectively.  We then exchanged files 
    and checked the other's work, producing human0b.txt human1b.txt.

6)  sort_human.sh - Get rid of messages that didn't have any sensible body 
    text.  Output the messages in a file sorted by the from email 
    address/subject/message.  This allows manual removal of repeated messages 
    in the set producing human_sorted.txt

7)  make_fixed.sh - Ouput a human fixed version of the original set of messages
    in the ./fixed directory. Also outputs a list of sentences in 
    all_sentences.txt and all_sentences_unique.txt

8)  From the unique sentences, we created a normalized version with verbalized 
    punctuation, spoken numbers, etc.  This process was done semi-automatically
    with human correction to fix mistakes in the normalization process.

    The order of sentences were randomized and the resulting 2239 sentences are
    in the files:

     mobile_orig.txt - Original corrected mixed case with 
                       symbols as typed on the BlackBerry
     mobile_vp.txt   - Lower case, symbols/numbers replaced
                       with verbalized form
     mobile_nvp.txt  - Lower case, stripped of all verbalized
                       punctuation
    
9)  Created a "simple" subset of the mobile_*.txt files, eliminating any 
    sentences that had symbols besides period, question mark, comma or 
    exclamation point.

    perl PruneVP.pl complex_vp.txt mobile_vp.txt \
         mobile_vp_simple.txt mobile_orig.txt \
         mobile_orig_simple.txt mobile_nvp.txt \
         mobile_nvp_simple.txt

    This resulted in 2109 sentences in mobile*simple.txt

10) Created a "nospell" subset of the "simple" subset.  This eliminated any 
    sentences with spelled acronyms, etc.

    perl PruneVP.pl complex_vp_spell.txt mobile_vp.txt \
         mobile_vp_nospell.txt mobile_orig.txt \
         mobile_orig_nospell.txt mobile_nvp.txt \
         mobile_nvp_nospell.txt
    
    This resulted in 1877 sentences in mobile*nospell.txt

11) Created a "body" subset of the "nospell" subset.  This eliminated sentences
    with fewer than 4 words and sentences that didn't end with a period, 
    question mark or exclamation point.

    perl PruneVP.pl complex_vp_spell.txt mobile_vp.txt \
         mobile_vp_body.txt mobile_orig.txt \
         mobile_orig_body.txt mobile_nvp.txt \
         mobile_nvp_body.txt 4 1

    This resulted in 1446 sentences in mobile*body.txt 

12) Created a "nonum" subset of the "body" subset.  This eliminated sentences 
    that had any numbers.

    perl PruneVP.pl complex_vp_spell.txt mobile_vp.txt \
         mobile_vp_nonum.txt mobile_orig.txt \
         mobile_orig_nonum.txt mobile_nvp.txt \
         mobile_nvp_nonum.txt 4 1 1

    This resulted in 1347 sentences in mobile*nonum.txt

Have fun!
Keith Vertanen
Per Ola Kristensson

Revision history:
==================================================
8/2011 - Initial release of Enron mobile email test set.
