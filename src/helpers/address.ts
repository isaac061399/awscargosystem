export const getAddressOptions = ({
  provinces,
  provinceId,
  cantonId
}: {
  provinces: any[];
  provinceId?: number;
  cantonId?: number;
}) => {
  const options: any = {
    provinces: [],
    cantons: [],
    districts: []
  };

  if (!provinces) {
    return options;
  }

  options.provinces = provinces.map((p) => ({ value: p.id, label: p.name }));

  if (provinceId) {
    const province = provinces.find((p) => p.id === provinceId);

    if (province) {
      options.cantons = province.cantons.map((c: any) => ({ value: c.id, label: c.name }));

      if (cantonId) {
        const canton = province.cantons.find((c: any) => c.id === cantonId);

        if (canton) {
          options.districts = canton.districts.map((d: any) => ({ value: d.id, label: d.name }));
        }
      }
    }
  }

  return options;
};

export const getClientAddress = (client: any) => {
  const addressParts = [];
  if (client?.district?.canton?.province?.name) {
    addressParts.push(client.district.canton.province.name);
  }
  if (client?.district?.canton?.name) {
    addressParts.push(client.district.canton.name);
  }
  if (client?.district?.name) {
    addressParts.push(client.district.name);
  }
  if (client?.address) {
    addressParts.push(client.address);
  }

  return addressParts.join(', ');
};
