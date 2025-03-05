.. _sfa:

Simple File Automation (SFA)
----------------------------

Historically, engineers tasked with weekly on-call duties within AIR DABI at Amazon Air grappled with a legacy process for ingesting CSV files from external business partners via SES and Lambda; that legacy process caused an enormous amount of stress for on-call engineers, as well as for customers, for two critical reasons: 

- Record changes required significant amounts of collaboration between on-call engineers and external business partners.
- The legacy product had sparse logging for debugging purposes that made investigation difficult not just for junior but also seasoned engineers. 

SFA is a modular product that can and has been forked for a variety of use-cases within Amazon Air. In addition to its core functionality as an FTP server and modular automated ETL product, SFA also offers customizable email notifications for monitoring. 

SFA is a successful product within AIR DABI because it empowers external business partners to independently manage the data that they share with AIR DABI via FTP server -- something that business stakeholders appreciate greatly, as it minimizes internal risk --  and significantly reduces stress for on-call engineers. SFA was a product idea that I imagined, tested, and presented for approval, and that I subsequently developed and deployed. AIR DABI is, to this day, from what I am told, continuing to fork SFA for different use-cases within Amazon Air.