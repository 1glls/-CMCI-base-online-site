'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Music, Users, BookOpen, Book, Heart, Library, ArrowRight } from 'lucide-react';
import { API_URL, getImageUrl } from '@/lib/api';

interface Ministry {
  id: string;
  title: string;
  description: string;
  icon: string;
  image?: string;
  link?: string;
}

const iconMap: { [key: string]: any } = {
  Music,
  Users,
  BookOpen,
  Book,
  Heart,
  Library
};

export default function Ministries() {
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMinistries();
  }, []);

  const fetchMinistries = async () => {
    try {
      const response = await fetch(`${API_URL}/api/ministries`);
      const data = await response.json();
      setMinistries(data);
    } catch (error) {
      console.error('Error fetching ministries:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (iconName: string) => {
    const IconComponent = iconMap[iconName] || BookOpen;
    return <IconComponent className="h-12 w-12" />;
  };

  if (loading) {
    return (
      <section id="ministeres" className="py-20 bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <p className="text-emerald-600 uppercase tracking-wider font-semibold mb-3">MINISTRY</p>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Nos Ministères
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Chargement...
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="ministeres" className="py-20 bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="container mx-auto px-4">
        {/* En-tête */}
        <div className="text-center mb-16">
          <p className="text-emerald-600 uppercase tracking-wider font-semibold mb-3">MINISTRY</p>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Nos Ministères à la CMCI
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Découvrez nos principaux ministères actuellement en place dans notre église. 
            Si vous souhaitez vous impliquer dans l'un de ces ministères, n'hésitez pas à nous contacter.
          </p>
        </div>

        {/* Grille des ministères */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {ministries.map((ministry, index) => (
            <Card 
              key={ministry.id} 
              className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-none bg-white overflow-hidden"
            >
              {/* Image du ministère */}
              {ministry.image && (
                <div className="relative h-48 w-full overflow-hidden">
                  <img 
                    src={getImageUrl(ministry.image)} 
                    alt={ministry.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                    <div className="p-3 rounded-full bg-white/90 backdrop-blur text-emerald-600 group-hover:scale-110 transition-transform">
                      {getIcon(ministry.icon)}
                    </div>
                    <span className="text-4xl font-bold text-white/90 group-hover:text-white transition-colors">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                  </div>
                </div>
              )}
              
              <CardHeader>
                <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-emerald-600 transition-colors">
                  {ministry.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 leading-relaxed mb-6">
                  {ministry.description}
                </CardDescription>
                {ministry.link && (
                  <a href={ministry.link}>
                    <Button 
                      variant="ghost" 
                      className="w-full group-hover:bg-emerald-600 group-hover:text-white transition-all"
                    >
                      En savoir plus
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </a>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Section Call-to-Action */}
        <div className="mt-16 text-center">
          <div className="inline-block p-8 bg-gradient-to-r from-emerald-600 to-blue-600 rounded-2xl shadow-xl">
            <h3 className="text-2xl font-bold text-white mb-3">
              Rejoignez l'un de nos ministères
            </h3>
            <p className="text-white/90 mb-6 max-w-xl">
              Nous serions ravis de vous accueillir dans l'un de nos ministères. 
              Contactez-nous pour plus d'informations.
            </p>
            <a href="#contact">
              <Button size="lg" variant="secondary" className="font-semibold">
                Nous Contacter
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
