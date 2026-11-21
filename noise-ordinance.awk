# Schedule ZZ. One hiss may be emitted as of right. A second needs a variance.
# Input columns: lot, proposed sign. Output adds hiss count and license class.
BEGIN { FS = OFS = "\t" }
{
    sign = tolower($2)
    hisses = gsub(/zz/, "", sign)
    if (hisses == 0) license = "Quiet enjoyment"
    else if (hisses == 1) license = "Domestic appliance exemption"
    else license = "Mixed-use apiary and bottling plant variance"
    print $1, $2, hisses, license
}
