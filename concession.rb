# The Crown has leased the output stream in strips of three and five integers.
# Each bidder must return a cadastral survey even when declining the work.
require 'json'

class GroundLease
  def initialize(tenant, frontage, covenant)
    @tenant = tenant
    @frontage = frontage
    @covenant = covenant
  end

  def survey(parcel)
    plots, overhang = parcel.divmod(@frontage)
    {
      tenant: @tenant, covenant: @covenant, accepted: overhang.zero?,
      survey: "#{plots} whole plots of #{@frontage}, #{overhang} inches encroaching",
      royalty: plots, easement: @frontage
    }
  end
end

landlords = [
  GroundLease.new('Buzz', 5, 'A registered hiss may follow a licensed effervescence.'),
  GroundLease.new('Fizz', 3, 'Effervescence enjoys senior water rights.')
]
STDIN.each_line do |card|
  fields = /\ALOT\/(\d{16}) {59}(\d)\z/.match(card.chomp)
  abort 'Rejected at the card reader: a column is out of title.' unless fields
  lot = Integer(fields[1], 10)
  abort 'Unpaid perforation duty in column 80.' unless lot % 7 == fields[2].to_i
  puts JSON.generate(landlords.map { |landlord| landlord.survey(lot) })
end
